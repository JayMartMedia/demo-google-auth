import * as localConfig from "./local.config.json";
import * as productionConfig from "./production.config.json";

const config = {
  'local': localConfig,
  'production': productionConfig
}

const environment: string = process.env.NODE_ENV || 'local';

/** Setup config variables **/
function getDbConnectionString () {
  const dbConnectionString = process.env.DB_CONNECTION_STRING
    || config[environment].DB_CONNECTION_STRING;
  if(!dbConnectionString) throw new Error('DB_CONNECTION_STRING must be provided');
  return dbConnectionString;
}

function getDbName () {
  const dbName = process.env.DB_NAME || config[environment].DB_NAME;
  if(!dbName) throw new Error('DB_NAME must be provided');
  return dbName;
}

function getRefreshTokenCollectionName () {
  const refreshTokenCollectionName = process.env.REFRESH_TOKEN_COLLECTION_NAME 
    || config[environment].REFRESH_TOKEN_COLLECTION_NAME
    || "refreshTokens";
  return refreshTokenCollectionName;
}

function getUsedJwtCollectionName () {
  const usedGoogleJwtCollectionName = process.env.USED_GOOGLE_JWT_COLLECTION_NAME
    || config[environment].USED_GOOGLE_JWT_COLLECTION_NAME
    || "usedGoogleJwts";
  return usedGoogleJwtCollectionName;
}

function getGoogleClientId () {
  const googleClientId = process.env.GOOGLE_CLIENT_ID
    || config[environment].GOOGLE_CLIENT_ID;
  if(!googleClientId) throw new Error('GOOGLE_CLIENT_ID must be provided');
  return googleClientId;
}

function getAllowedOrigins () {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
    || config[environment].ALLOWED_ORIGINS?.split(',');
  if(!allowedOrigins) throw new Error('ALLOWED_ORIGINS must be provided');
  return allowedOrigins;
}

function getPrivateAccessSigningKey () {
  const privateAccessSigningKey = process.env.PRIVATE_ACCESS_SIGNING_KEY
    || config[environment].PRIVATE_ACCESS_SIGNING_KEY;
  if(!privateAccessSigningKey) throw new Error('PRIVATE_ACCESS_SIGNING_KEY must be provided');
  return privateAccessSigningKey;
}

function getPrivateRefreshSigningKey () {
  const privateRefreshSigningKey = process.env.PRIVATE_REFRESH_SIGNING_KEY
    || config[environment].PRIVATE_REFRESH_SIGNING_KEY;
  if(!privateRefreshSigningKey) throw new Error('PRIVATE_REFRESH_SIGNING_KEY must be provided');
  return privateRefreshSigningKey;
}

function getPort () {
  const port = process.env.PORT
    || config[environment].PORT;
  if(!port) throw new Error('PORT must be provided');

  return Number(port);
}

function getIssuer () {
  const issuer = process.env.ISSUER
    || config[environment].ISSUER;
  if(!issuer) throw new Error('ISSUER must be provided');

  return issuer;
}

function getAccessTokenLength () {
  const accessTokenLength = process.env.ACCESS_TOKEN_LENGTH
    || config[environment].ACCESS_TOKEN_LENGTH;
  if(!accessTokenLength) throw new Error('ACCESS_TOKEN_LENGTH must be provided');
  
  return Number(accessTokenLength);
}

function getRefreshTokenLength () {
  const refreshTokenLength = process.env.REFRESH_TOKEN_LENGTH
    || config[environment].REFRESH_TOKEN_LENGTH;
  if(!refreshTokenLength) throw new Error('REFRESH_TOKEN_LENGTH must be provided');
  
  return Number(refreshTokenLength);
}


// export config variables
export const env = {
  dbConnectionString: getDbConnectionString(),
  dbName: getDbName(),
  refreshTokenCollectionName: getRefreshTokenCollectionName(),
  usedGoogleJwtCollectionName: getUsedJwtCollectionName(),
  googleClientId: getGoogleClientId(),
  allowedOrigins: getAllowedOrigins(),
  privateAccessSigningKey: getPrivateAccessSigningKey(),
  privateRefreshSigningKey: getPrivateRefreshSigningKey (),
  port: getPort(),
  issuer: getIssuer(),
  accessTokenLength: getAccessTokenLength(),
  refreshTokenLength: getRefreshTokenLength()
}