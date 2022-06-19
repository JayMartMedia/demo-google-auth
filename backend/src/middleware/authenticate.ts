import { Response } from 'express-serve-static-core';
import { RequestWithUserInfo } from './RequestWithUserInfo';

export function setupAuthenticateMiddleware(jwtDomain: IJwtDomain) {
  function authenticate(req: RequestWithUserInfo, res: Response, next: () => void) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.replace("Bearer ", "");
      const userInfo = jwtDomain.verifyAccessToken(token);
      if (!userInfo) {
        return res.sendStatus(401);
      }
      req.userInfo = userInfo;
      next();
    } catch (e) {
      console.error(`Error in authentication middleware ${e.message}`);
      return res.sendStatus(500);
    }
  }
  return authenticate;
}
