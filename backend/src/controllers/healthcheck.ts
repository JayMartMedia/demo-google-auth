import { Express } from 'express';

export function setupHealthcheckController(app: Express) {
  app.get("/healthcheck", (req, res) => {
    return res.send({
      status: "up"
    });
  });
}
