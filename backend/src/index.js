// setup express
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors({
  origin: [
    "http://localhost:4400"
  ]
}));
const port = 4401

// configure google auth
const { OAuth2Client } = require("google-auth-library");
const CLIENT_ID = "403706356522-9l5kmo3oujjk8ho182ec3kts8k96d935.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

async function verify(token) {
  token = token.replace("Bearer ", "");
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID
    });
    console.log("ticket", ticket);
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

app.get("/secure", async (req, res) => {
  const authHeader = req.headers.authorization;
  console.log("Auth Header: ", authHeader);
  // TODO: convert to middleware
  if (await verify(authHeader)) {
    res.send({ message: "Here is secure response!" });
  } else {
    res.sendStatus(401).send();
  }
})

// start server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
