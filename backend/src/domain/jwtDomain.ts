import { ITokenRepository } from "../repository/ITokenRepository";
import { AccessTokenPayload, RefreshTokenPayload } from "../types/auth-interfaces";
import * as jwt from "jsonwebtoken";
import { ACCESS_TOKEN_LENGTH, ISSUER, PRIVATE_SIGNING_KEY, REFRESH_TOKEN_LENGTH, CLIENT_ID } from "../constants";
import { OAuth2Client } from "google-auth-library";

export function setupJwtDomain(tokenRepository: ITokenRepository, client: OAuth2Client) {
  function generateAccessToken(data: { userId: string, picture: string, name: string, email: string }): string {
    const issuedAtTime = Math.floor(Date.now() / 1000);
    const expiryTime = issuedAtTime + ACCESS_TOKEN_LENGTH;
    const payload: AccessTokenPayload = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      picture: data.picture,
      iss: ISSUER,
      iat: issuedAtTime,
      exp: expiryTime,
      type: "access"
    }
    const token: string = jwt.sign(payload, PRIVATE_SIGNING_KEY, { algorithm: 'HS256' });
    return token;
  }

  function generateRefreshToken(data: { userId: string, picture: string, name: string, email: string }): string {
    const issuedAtTime = Math.floor(Date.now() / 1000);
    const expiryTime = issuedAtTime + REFRESH_TOKEN_LENGTH;
    const payload: RefreshTokenPayload = {
      userId: data.userId,
      picture: data.picture,
      name: data.name,
      email: data.email,
      iss: ISSUER,
      iat: issuedAtTime,
      exp: expiryTime
    }
    const token: string = jwt.sign(payload, PRIVATE_SIGNING_KEY, { algorithm: 'HS256' });
    return token;
  }

  async function verifyRefreshToken(token: string): Promise<boolean> {
    try {
      const decoded: RefreshTokenPayload = <RefreshTokenPayload>jwt.verify(token, PRIVATE_SIGNING_KEY, { issuer: ISSUER });
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

  function verifyAccessToken(token: string): boolean {
    try {
      if (token === 'null') {
        throw new Error('authorization header null');
      }
      const decoded: AccessTokenPayload = <AccessTokenPayload>jwt.verify(token, PRIVATE_SIGNING_KEY, { issuer: ISSUER });
      if (decoded.type !== "access") {
        throw new Error('Not a valid access token');
      }
      return true;
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
        audience: CLIENT_ID
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
