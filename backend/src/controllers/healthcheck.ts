import { Express } from 'express';
import { timestring } from '../utils/dateUtils';

export function setupHealthcheckController(app: Express) {
  app.get("/healthcheck", (req, res) => {
    console.log(`${timestring()}: Request to endpoint: /healthcheck`);
    return res.send({
      status: "up"
    });
  });
}
