const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();

// setup constants
const port = 4401
const privateSigningKey = "thisisasecret";

// setup express
app.use(cors({
  origin: [
    "http://localhost:4400"
  ]
}));
app.use(express.json());

// configure google auth
const { OAuth2Client } = require("google-auth-library");
const CLIENT_ID = "403706356522-9l5kmo3oujjk8ho182ec3kts8k96d935.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);
const refreshTokens = [];

function addRefreshToken(token) {
  refreshTokens.push(token);
}

function invalidateRefreshToken(token) {
  const index = refreshTokens.findIndex(element => element === token);
  if (index !== -1) {
    refreshTokens.splice(index, 1);
  }
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
    if (!refreshTokens.includes(token)) {
      throw new Error('Refresh token does not exist or has been invalidated');
    };
    return true;
  } catch (err) {
    console.log(err);
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
    console.log(err);
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
    console.log(e);
    return false;
  }
}

// setup endpoints
app.get("/helloworld", (req, res) => {
  res.send("Hello World!")
})

// secure endpoint
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
  return res.sendStatus(401).send();
});

app.post("/token", async (req, res) => {
  const googleJwt = req.body.googleJwt;
  if (await verifyGoogleJwt(googleJwt)) {
    const payload = jwt.decode(googleJwt);
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    addRefreshToken(newRefreshToken);
    res.send({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })
  } else {
    res.sendStatus(401).send();
  }
});

app.post("/refresh", async (req, res) => {
  const refreshToken = req.body.refreshToken;
  const payload = jwt.decode(refreshToken);
  console.log('payload', payload);
  if (verifyRefreshToken(refreshToken)) {
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    invalidateRefreshToken(refreshToken);
    addRefreshToken(newRefreshToken);
    res.send({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })
  } else {
    res.sendStatus(401).send();
  }
});

app.post("/invalidate", async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;
    invalidateRefreshToken(refreshToken);
  } catch (e) {
    console.error(e);
    res.sendStatus(500).send();
  }
});

// start server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
