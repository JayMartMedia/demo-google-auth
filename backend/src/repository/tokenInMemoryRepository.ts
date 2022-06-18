import { GoogleJwtMeta, RefreshTokenMeta } from "../types/auth-interfaces";
import { removeMatchesFromImmutableArray } from "../utils/removeMatchesFromImmutableArray";
import { ITokenRepository } from "./ITokenRepository";

export class tokenInMemoryRepository implements ITokenRepository {
  private _refreshTokens: RefreshTokenMeta[] = [];
  private _usedGoogleJwts: GoogleJwtMeta[] = [];

  /** Private Methods **/

  /** Public Methods **/
  // refresh tokens
  insertRefreshTokenMeta = async function (refreshTokenMeta: RefreshTokenMeta) {
    this._refreshTokens.push(refreshTokenMeta);
  };

  deleteRefreshTokenMeta = async function (token: string) {
    const index = this._refreshTokens.findIndex(element => element.token === token);
    if (index !== -1) {
      this._refreshTokens.splice(index, 1);
    }
  };

  deleteRefreshTokenMetasForUser = async function (userId: string) {
    this._refreshTokens = this._refreshTokens.filter((refreshTokenMeta: RefreshTokenMeta) => {
      return refreshTokenMeta.user !== userId
    })
  };

  checkForRefreshTokenMeta = async function (token: string) {
    return this._refreshTokens.some((refreshTokenMeta: RefreshTokenMeta) => {
      return refreshTokenMeta.token === token;
    });
  };

  // google tokens
  addUsedGoogleJwtMeta = async function ({ token, exp }: GoogleJwtMeta) {
    this._usedGoogleJwts.push({
      token,
      exp
    });
  }

  checkForUsedGoogleJwtMeta = async function (token: string) {
    console.log(token);
    return this._usedGoogleJwts.some((usedGoogleJwt: GoogleJwtMeta) => {
      return usedGoogleJwt.token === token;
    })
  }
}
