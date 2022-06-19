import { Express } from 'express';

export function setupSecureController(app: Express, jwtDomain: IJwtDomain) {
  app.get("/secure", async (req, res) => {
    // TODO: convert to middleware
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.replace("Bearer ", "");
      if (jwtDomain.verifyAccessToken(token)) {
        return res.send({ message: "Connected to secure endpoint successfully!" });
      }
    } catch (e) {
      console.error(`Not authorized ${e.message}`);
    }
    return res.sendStatus(401);
  });
}
