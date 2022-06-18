import * as express from "express";
import * as cors from "cors";
import * as jwt from "jsonwebtoken";
import * as swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./swagger.json";
import { timestring } from "./utils/dateUtils";
import { AccessTokenPayload, GoogleJwtPayload, RefreshTokenPayload } from "./types/auth-interfaces";
import { ITokenRepository } from "./repository/ITokenRepository";
import { tokenInMemoryRepository } from "./repository/tokenInMemoryRepository";
import { OAuth2Client } from "google-auth-library";
import { CLIENT_ID, ALLOWED_ORIGINS, PRIVATE_SIGNING_KEY, PORT, ISSUER, REFRESH_TOKEN_LENGTH, ACCESS_TOKEN_LENGTH } from "./constants";

// setup express
const app = express();
app.use(cors({
  origin: ALLOWED_ORIGINS
}));
app.use(express.json());

// setup swagger
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// configure google auth
const client = new OAuth2Client(CLIENT_ID);

const tokenRepository: ITokenRepository = new tokenInMemoryRepository();

function generateAccessToken(data: { userId: string, picture: string, name: string, email: string }): string {
  const issuedAtTime = Math.floor(Date.now() / 1000);
  const expiryTime = issuedAtTime + ACCESS_TOKEN_LENGTH;
  const payload: AccessTokenPayload = {
    userId: data.userId,
    name: data.name,
    email: data.email,
    picture: data.picture,
    iss: ISSUER,
    iat: issuedAtTime,
    exp: expiryTime,
    type: "access"
  }
  const token: string = jwt.sign(payload, PRIVATE_SIGNING_KEY, { algorithm: 'HS256' });
  return token;
}

function generateRefreshToken(data: { userId: string, picture: string, name: string, email: string }): string {
  const issuedAtTime = Math.floor(Date.now() / 1000);
  const expiryTime = issuedAtTime + REFRESH_TOKEN_LENGTH;
  const payload: RefreshTokenPayload = {
    userId: data.userId,
    picture: data.picture,
    name: data.name,
    email: data.email,
    iss: ISSUER,
    iat: issuedAtTime,
    exp: expiryTime
  }
  const token: string = jwt.sign(payload, PRIVATE_SIGNING_KEY, { algorithm: 'HS256' });
  return token;
}

async function verifyRefreshToken(token: string): Promise<boolean> {
  try {
    const decoded: RefreshTokenPayload = <RefreshTokenPayload>jwt.verify(token, PRIVATE_SIGNING_KEY, { issuer: ISSUER });
    if (!(await tokenRepository.checkForRefreshTokenMeta(token))) {
      await tokenRepository.deleteRefreshTokenMetasForUser(decoded.email);
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
    const decoded: AccessTokenPayload = <AccessTokenPayload>jwt.verify(token, PRIVATE_SIGNING_KEY, { issuer: ISSUER });
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
  console.log(`${timestring()}: Request to endpoint: /helloworld`);
  return res.send("Hello World!")
})

// secure endpoint to check whether access token in auth header is valid
app.get("/secure", async (req, res) => {
  console.log(`${timestring()}: Request to endpoint: /secure`);
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
  console.log(`${timestring()}: Request to endpoint: /token`);
  const googleJwt = req.body.googleJwt;
  if (!googleJwt) return res.sendStatus(401);
  if (await tokenRepository.checkForUsedGoogleJwtMeta(googleJwt)) {
    return res.sendStatus(401);
  }
  if (await verifyGoogleJwt(googleJwt)) {
    const payload: GoogleJwtPayload = <GoogleJwtPayload>jwt.decode(googleJwt, { json: true });
    await tokenRepository.addUsedGoogleJwtMeta({ token: googleJwt, exp: payload.exp });
    const newAccessToken = generateAccessToken({ ...payload, userId: `g:${payload.email}` });
    const newRefreshToken = generateRefreshToken({ ...payload, userId: `g:${payload.email}` });
    await tokenRepository.insertRefreshTokenMeta({
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
  console.log(`${timestring()}: Request to endpoint: /refresh`);
  const refreshToken = req.body.refreshToken;
  const payload: RefreshTokenPayload = <RefreshTokenPayload>jwt.decode(refreshToken, { json: true, complete: false });
  if (await verifyRefreshToken(refreshToken)) {
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    await tokenRepository.deleteRefreshTokenMeta(refreshToken);
    await tokenRepository.insertRefreshTokenMeta({
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
  console.log(`${timestring()}: Request to endpoint: /invalidate`);
  try {
    const refreshToken = req.body.refreshToken;
    await tokenRepository.deleteRefreshTokenMeta(refreshToken);
    return res.sendStatus(204);
  } catch (e) {
    console.error(e);
    return res.sendStatus(500);
  }
});

// start server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
