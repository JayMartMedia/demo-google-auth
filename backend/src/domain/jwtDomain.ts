import { ITokenRepository } from "../repositories/ITokenRepository";
import { AccessTokenPayload, RefreshTokenPayload } from "../types/auth-interfaces";
import * as jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";

export function setupJwtDomain(tokenRepository: ITokenRepository, client: OAuth2Client) {
  function generateAccessToken(data: { userId: string, picture: string, name: string, email: string }): string {
    const issuedAtTime = Math.floor(Date.now() / 1000);
    const expiryTime = issuedAtTime + env.accessTokenLength;
    const payload: AccessTokenPayload = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      picture: data.picture,
      iss: env.issuer,
      iat: issuedAtTime,
      exp: expiryTime,
      type: "access"
    }
    const token: string = jwt.sign(payload, env.privateSigningKey, { algorithm: 'HS256' });
    return token;
  }

  function generateRefreshToken(data: { userId: string, picture: string, name: string, email: string }): string {
    const issuedAtTime = Math.floor(Date.now() / 1000);
    const expiryTime = issuedAtTime + env.refreshTokenLength;
    const payload: RefreshTokenPayload = {
      userId: data.userId,
      picture: data.picture,
      name: data.name,
      email: data.email,
      iss: env.issuer,
      iat: issuedAtTime,
      exp: expiryTime
    }
    const token: string = jwt.sign(payload, env.privateSigningKey, { algorithm: 'HS256' });
    return token;
  }

  async function verifyRefreshToken(token: string): Promise<boolean> {
    try {
      const decoded: RefreshTokenPayload = <RefreshTokenPayload>jwt.verify(token, env.privateSigningKey, { issuer: env.issuer });
      if (!(await tokenRepository.checkForRefreshTokenMeta(token))) {
        await tokenRepository.deleteRefreshTokenMetasForUser(decoded.email);
        throw new Error('Refresh token does not exist or has been invalidated');
      };
      return true;
    } catch (e) {
      console.error(`Refresh token invalid ${e.message}`);
      return false;
    }
  }

  function verifyAccessToken(token: string): IUserInfo | false {
    try {
      if (token === 'null') {
        throw new Error('authorization header null');
      }
      const decoded: AccessTokenPayload = <AccessTokenPayload>jwt.verify(token, env.privateSigningKey, { issuer: env.issuer });
      if (decoded.type !== "access") {
        throw new Error('Not a valid access token');
      }
      const userInfo: IUserInfo = {
        userId: decoded.userId,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture
      }
      return userInfo;
    } catch (e) {
      console.error(`Access token invalid: ${e.message}`);
      return false;
    }
  }

  async function verifyGoogleJwt(token: string): Promise<boolean> {
    try {
      token = token.replace("Bearer ", "");
      await client.verifyIdToken({
        idToken: token,
        audience: env.googleClientId
      });
      return true;
    } catch (e) {
      console.error(`Google JWT invalid ${e.message}`);
      return false;
    }
  }
  const jwtDomain: IJwtDomain = {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    verifyAccessToken,
    verifyGoogleJwt
  }

  return jwtDomain;
}
