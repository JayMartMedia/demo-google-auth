import * as localConfig from "./local.config.json";
import * as productionConfig from "./production.config.json";

const config = {
  'local': localConfig,
  'production': productionConfig
}

const environment: string = process.env.NODE_ENV || 'local';

/** Setup config variables **/
function getDbConnectionString () {
  const dbConnectionString = process.env.dbConnectionString
    || config[environment].dbConnectionString;
  if(!dbConnectionString) throw new Error('dbConnectionString must be provided');
  return dbConnectionString;
}

function getDbName () {
  const dbName = process.env.dbName || config[environment].dbName;
  if(!dbName) throw new Error('dbName must be provided');
  return dbName;
}

function getRefreshTokenCollectionName () {
  const refreshTokenCollectionName = process.env.refreshTokenCollectionName 
    || config[environment].refreshTokenCollectionName
    || "refreshTokens";
  return refreshTokenCollectionName;
}

function getUsedJwtCollectionName () {
  const usedGoogleJwtCollectionName = process.env.usedGoogleJwtCollectionName
    || config[environment].usedGoogleJwtCollectionName
    || "usedGoogleJwts";
  return usedGoogleJwtCollectionName;
}

function getGoogleClientId () {
  const googleClientId = process.env.googleClientId
    || config[environment].googleClientId;
  if(!googleClientId) throw new Error('googleClientId must be provided');
  return googleClientId;
}

function getAllowedOrigins () {
  const allowedOrigins = process.env.allowedOrigins?.split(',')
    || config[environment].allowedOrigins?.split(',');
  if(!allowedOrigins) throw new Error('allowedOrigins must be provided');
  return allowedOrigins;
}

function getPrivateSigningKey () {
  const privateSigningKey = process.env.privateSigningKey
    || config[environment].privateSigningKey;
  if(!privateSigningKey) throw new Error('privateSigningKey must be provided');
  return privateSigningKey;
}

function getPort () {
  const port = process.env.PORT
    || config[environment].port;
  if(!port) throw new Error('port must be provided');

  return Number(port);
}

function getIssuer () {
  const issuer = process.env.issuer
    || config[environment].issuer;
  if(!issuer) throw new Error('issuer must be provided');

  return issuer;
}

function getAccessTokenLength () {
  const accessTokenLength = process.env.accessTokenLength
    || config[environment].accessTokenLength;
  if(!accessTokenLength) throw new Error('accessTokenLength must be provided');
  
  return Number(accessTokenLength);
}

function getRefreshTokenLength () {
  const refreshTokenLength = process.env.refreshTokenLength
    || config[environment].refreshTokenLength;
  if(!refreshTokenLength) throw new Error('refreshTokenLength must be provided');
  
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
  privateSigningKey: getPrivateSigningKey(),
  port: getPort(),
  issuer: getIssuer(),
  accessTokenLength: getAccessTokenLength(),
  refreshTokenLength: getRefreshTokenLength()
}