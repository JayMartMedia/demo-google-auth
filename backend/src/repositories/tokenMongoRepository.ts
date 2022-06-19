import { ITokenRepository } from "./ITokenRepository";
import { GoogleJwtMeta, RefreshTokenMeta } from "../types/auth-interfaces";
import { Collection, Db, MongoClient } from "mongodb";

const mongoConnectionString = 'mongodb://localhost:27017';
const mongoDbName = 'demo-auth';
const refreshCollectionName = 'refreshTokens';
const usedGoogleJwtCollectionName = 'usedGoogleJwts';

export class tokenMongoRepository implements ITokenRepository {
  _refreshCollection: Collection;
  _usedGoogleCollection: Collection;

  /** Private Methods **/
  _configureCollections() {
    const client = new MongoClient(mongoConnectionString);
    client.connect();
    const db = client.db(mongoDbName);

    this._refreshCollection = db.collection(refreshCollectionName);
    this._usedGoogleCollection = db.collection(usedGoogleJwtCollectionName);
  }

  /** Public Methods **/
  // refresh tokens
  insertRefreshTokenMeta = async function (refreshTokenMeta: RefreshTokenMeta) {
    const refreshCollection: Collection = this._refreshCollection;
    await refreshCollection.insertOne(refreshTokenMeta);
  };

  deleteRefreshTokenMeta = async function (token: string) {
    const refreshCollection: Collection = this._refreshCollection;
    await refreshCollection.deleteOne({
      token: token
    });
  };

  deleteRefreshTokenMetasForUser = async function (userId: string) {
    const refreshCollection: Collection = this._refreshCollection;
    await refreshCollection.deleteMany({
      user: userId
    });
  };

  checkForRefreshTokenMeta = async function (token: string) {
    const refreshCollection: Collection = this._refreshCollection;
    const result = await refreshCollection.findOne({
      token: token
    });
    console.log(result);
    return !!result; // coerce into boolean
  };

  // google tokens
  addUsedGoogleJwtMeta = async function (googleJwtMeta: GoogleJwtMeta) {
    const usedGoogleCollection: Collection = this._usedGoogleCollection;
    await usedGoogleCollection.insertOne(googleJwtMeta);
  }

  checkForUsedGoogleJwtMeta = async function (token: string) {
    const usedGoogleCollection: Collection = this._usedGoogleCollection;
    const result = await usedGoogleCollection.findOne({
      token: token
    });
    console.log(result);
    return !!result; // coerce into boolean
  }

  /** Constructor **/
  constructor() {
    this._configureCollections();
  }
}
