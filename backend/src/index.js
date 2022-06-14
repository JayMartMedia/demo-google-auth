const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");
const { removeMatchesFromImmutableArray } = require("./utils/removeMatchesFromImmutableArray.js");

// setup constants
const port = 4401
const privateSigningKey = "thisisasecret";

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
const refreshTokens = [];
const usedGoogleJwts = [];

function addRefreshToken({user, token}) {
  refreshTokens.push({
    user,
    token
  });
}

function invalidateRefreshToken(token) {
  const index = refreshTokens.findIndex(element => element.token === token);
  if (index !== -1) {
    refreshTokens.splice(index, 1);
  }
}

function invalidateRefreshTokensForUser(user) {
  removeMatchesFromImmutableArray(refreshTokens, refreshToken => {
    return refreshToken.user === user;
  });
}

function addUsedGoogleJwt(token, exp) {
  usedGoogleJwts.push({token, exp});
}

function checkUsedGoogleJwt(token) {
  return usedGoogleJwts.some(usedGoogleJwt => usedGoogleJwt.token === token);
}

function generateAccessToken(data) {
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
  const token = jwt.sign(payload, privateSigningKey, { algorithm: 'HS256' });
  return token;
}

function generateRefreshToken(data) {
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
  const token = jwt.sign(payload, privateSigningKey, { algorithm: 'HS256' });
  return token;
}

function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, privateSigningKey, { issuer: 'http://localhost:4401' });
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

function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, privateSigningKey, { issuer: 'http://localhost:4401' });
    if (decoded.type !== "access") {
      throw new Error('Not a valid access token');
    }
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function verifyGoogleJwt(token) {
  token = token.replace("Bearer ", "");
  try {
    const ticket = await client.verifyIdToken({
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
    const payload = jwt.decode(googleJwt);
    addUsedGoogleJwt(googleJwt, payload.exp);
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    addRefreshToken({
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
  const payload = jwt.decode(refreshToken);
  if (verifyRefreshToken(refreshToken)) {
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    invalidateRefreshToken(refreshToken);
    addRefreshToken({
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
