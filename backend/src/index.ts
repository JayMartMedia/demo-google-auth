import * as express from "express";
import * as cors from "cors";
import * as jwt from "jsonwebtoken";
import * as swaggerUi from "swagger-ui-express";
import { removeMatchesFromImmutableArray } from "./utils/removeMatchesFromImmutableArray";

// setup constants
const port: number = 4401
const privateSigningKey: string = "thisisasecret";

// setup express
const app = express();
app.use(cors({
  origin: [
    "http://localhost:4400"
  ]
}));
app.use(express.json());

// setup swagger
const swaggerDocument = require('./swagger.json');
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// configure google auth
const { OAuth2Client } = require("google-auth-library");
const CLIENT_ID = "403706356522-9l5kmo3oujjk8ho182ec3kts8k96d935.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

type RefreshTokenMeta = {
  user: string,
  token: string,
}
type GoogleJwtMeta = {
  token: string,
  exp: number,
}
type RefreshTokenPayload = {
  userId: string, // user id is in format of `{id of platform}:{email}` for example: g:email@gmail.com
  iss: string,
  iat: number,
  exp: number,
} & jwt.JwtPayload;
type AccessTokenPayload = {
  userId: string, // user id is in format of `{id of platform}:{email}` for example: g:email@gmail.com
  iss: string,
  iat: number,
  exp: number,
  type: string,
} & jwt.JwtPayload;
// the google jwt has many more fields, only adding the needed ones here
type GoogleJwtPayload = {
  email: string,
  exp: number,
} & jwt.JwtPayload;
const refreshTokens: RefreshTokenMeta[] = [];
const usedGoogleJwts: GoogleJwtMeta[] = [];

function addRefreshTokenMeta({user, token}: RefreshTokenMeta): void {
  refreshTokens.push({
    user,
    token
  });
}

function invalidateRefreshToken(token: string): void {
  const index = refreshTokens.findIndex(element => element.token === token);
  if (index !== -1) {
    refreshTokens.splice(index, 1);
  }
}

function invalidateRefreshTokensForUser(user: string): void {
  removeMatchesFromImmutableArray(refreshTokens, (refreshToken: RefreshTokenMeta) => {
    return refreshToken.user === user;
  });
}

function addUsedGoogleJwtMeta({token, exp}: GoogleJwtMeta): void {
  usedGoogleJwts.push({token, exp});
}

function checkUsedGoogleJwt(token: string): boolean {
  return usedGoogleJwts.some(usedGoogleJwt => usedGoogleJwt.token === token);
}

function generateAccessToken(data: any): string {
  const oneHourInSeconds = 60 * 60;
  const issuer = "http://localhost:4401"
  const issuedAtTime = Math.floor(Date.now() / 1000);
  const expiryTime = issuedAtTime + oneHourInSeconds;
  const payload = {
    ...data,
    type: "access",
    iss: issuer,
    iat: issuedAtTime,
    exp: expiryTime
  }
  const token: string = jwt.sign(payload, privateSigningKey, { algorithm: 'HS256' });
  return token;
}

function generateRefreshToken(data: any): string {
  const oneDayInSeconds = 60 * 60 * 24;
  const issuer = "http://localhost:4401"
  const issuedAtTime = Math.floor(Date.now() / 1000);
  const expiryTime = issuedAtTime + oneDayInSeconds;
  const payload = {
    ...data,
    iss: issuer,
    iat: issuedAtTime,
    exp: expiryTime
  }
  const token: string = jwt.sign(payload, privateSigningKey, { algorithm: 'HS256' });
  return token;
}

function verifyRefreshToken(token: string): boolean {
  try {
    const decoded: RefreshTokenPayload = <RefreshTokenPayload>jwt.verify(token, privateSigningKey, { issuer: 'http://localhost:4401' });
    if (!refreshTokens.some(refreshToken => refreshToken.token === token)) {
      invalidateRefreshTokensForUser(decoded.email);
      throw new Error('Refresh token does not exist or has been invalidated');
    };
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

function verifyAccessToken(token: string): boolean {
  try {
    const decoded: AccessTokenPayload = <AccessTokenPayload>jwt.verify(token, privateSigningKey, { issuer: 'http://localhost:4401' });
    if (decoded.type !== "access") {
      throw new Error('Not a valid access token');
    }
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function verifyGoogleJwt(token: string): Promise<boolean> {
  try {
    token = token.replace("Bearer ", "");
    await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID
    });
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

// setup endpoints
app.get("/helloworld", (req, res) => {
  return res.send("Hello World!")
})

// endpoint for debugging purposes
app.get("/refreshtokens", (req, res) => {
  return res.send(refreshTokens);
});

// endpoint for debugging purposes
app.get("/usedgooglejwts", (req, res) => {
  return res.send(usedGoogleJwts);
})

// secure endpoint to check whether access token in auth header is valid
app.get("/secure", async (req, res) => {
  // TODO: convert to middleware
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.replace("Bearer ", "");
    if (await verifyAccessToken(token)) {
      // happy case
      return res.send({ message: "Here is secure response!" });
    }
  } catch (e) {
    console.error(e);
  }
  return res.sendStatus(401);
});

// get new refresh and access tokens using a google JWT
app.post("/token", async (req, res) => {
  const googleJwt = req.body.googleJwt;
  if(!googleJwt) return res.sendStatus(401);
  if(checkUsedGoogleJwt(googleJwt)) {
    return res.sendStatus(401);
  }
  if (await verifyGoogleJwt(googleJwt)) {
    const payload: GoogleJwtPayload = <GoogleJwtPayload>jwt.decode(googleJwt, {json: true});
    addUsedGoogleJwtMeta({token: googleJwt, exp: payload.exp});
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    addRefreshTokenMeta({
      user: payload.email,
      token: newRefreshToken
    });
    return res.send({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })
  } else {
    return res.sendStatus(401);
  }
});

// get new refresh and access tokens using a refresh token
app.post("/refresh", async (req, res) => {
  const refreshToken = req.body.refreshToken;
  const payload: RefreshTokenPayload = <RefreshTokenPayload>jwt.decode(refreshToken, {json: true, complete: false});
  if (verifyRefreshToken(refreshToken)) {
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    invalidateRefreshToken(refreshToken);
    addRefreshTokenMeta({
      user: payload.email,
      token: newRefreshToken
    });
    return res.send({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })
  } else {
    return res.sendStatus(401);
  }
});

// invalidate a single refresh key (useful for logging out)
app.post("/invalidate", async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;
    invalidateRefreshToken(refreshToken);
    return res.sendStatus(204);
  } catch (e) {
    console.error(e);
    return res.sendStatus(500);
  }
});

// start server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
