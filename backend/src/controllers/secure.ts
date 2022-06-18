import { Express } from 'express';
import { timestring } from '../utils/dateUtils';

export function setupSecureController(app: Express, jwtDomain: IJwtDomain) {
  app.get("/secure", async (req, res) => {
    console.log(`${timestring()}: Request to endpoint: /secure`);
    // TODO: convert to middleware
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.replace("Bearer ", "");
      if (await jwtDomain.verifyAccessToken(token)) {
        return res.send({ message: "Connected to secure endpoint successfully!" });
      }
    } catch (e) {
      console.error(e);
    }
    return res.sendStatus(401);
  });
}
