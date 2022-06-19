import { Express } from 'express';
import { RequestWithUserInfo } from '../middleware/RequestWithUserInfo';

export function setupSecureController(app: Express, authenticate: (req, res, next) => void) {
  app.get("/secure", [authenticate], async (req: RequestWithUserInfo, res) => {
    return res.send({
      message: "Connected to secure endpoint successfully!"
    });
  });
}
