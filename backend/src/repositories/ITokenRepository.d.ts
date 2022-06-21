import { GoogleJwtMeta, RefreshTokenMeta } from "../types/auth-interfaces";

interface ITokenRepository {
  // refresh tokens
  insertRefreshTokenMeta: (refreshTokenMeta: RefreshTokenMeta) => Promise<void>;
  deleteRefreshTokenMeta: (token: string) => Promise<void>;
  deleteRefreshTokenMetasForUser: (userId: string) => Promise<void>;
  checkForRefreshTokenMeta: (token: string) => Promise<boolean>;

  // google tokens
  addUsedGoogleJwtMeta: (googleJwt: GoogleJwtMeta) => Promise<void>;
  checkForUsedGoogleJwtMeta: (token: string) => Promise<boolean>;
}
