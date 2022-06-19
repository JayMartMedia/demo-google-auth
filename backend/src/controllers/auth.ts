import { Express } from 'express';
import { ITokenRepository } from '../repository/ITokenRepository';
import { GoogleJwtPayload, RefreshTokenPayload } from '../types/auth-interfaces';
import * as jwt from "jsonwebtoken";
import { timestring } from '../utils/dateUtils';

export function setupAuthController(app: Express, tokenRepository: ITokenRepository, jwtDomain: IJwtDomain) {
  // get new refresh and access tokens using a google JWT
  app.post("/token", async (req, res) => {
    const googleJwt = req.body.googleJwt;
    if (!googleJwt) return res.sendStatus(401);
    if (await tokenRepository.checkForUsedGoogleJwtMeta(googleJwt)) {
      return res.sendStatus(401);
    }
    if (await jwtDomain.verifyGoogleJwt(googleJwt)) {
      const payload: GoogleJwtPayload = <GoogleJwtPayload>jwt.decode(googleJwt, { json: true });
      await tokenRepository.addUsedGoogleJwtMeta({ token: googleJwt, exp: payload.exp });
      const newAccessToken = jwtDomain.generateAccessToken({ ...payload, userId: `g:${payload.email}` });
      const newRefreshToken = jwtDomain.generateRefreshToken({ ...payload, userId: `g:${payload.email}` });
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
    const refreshToken = req.body.refreshToken;
    const payload: RefreshTokenPayload = <RefreshTokenPayload>jwt.decode(refreshToken, { json: true, complete: false });
    if (await jwtDomain.verifyRefreshToken(refreshToken)) {
      const newAccessToken = jwtDomain.generateAccessToken(payload);
      const newRefreshToken = jwtDomain.generateRefreshToken(payload);
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
    try {
      const refreshToken = req.body.refreshToken;
      await tokenRepository.deleteRefreshTokenMeta(refreshToken);
      return res.sendStatus(204);
    } catch (e) {
      console.error(`Failed to invalidate: ${e.message}`);
      return res.sendStatus(500);
    }
  });
}
