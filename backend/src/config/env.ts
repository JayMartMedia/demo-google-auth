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


// export config variables
export const env = {
  dbConnectionString: getDbConnectionString(),
  dbName: getDbName(),
  refreshTokenCollectionName: getRefreshTokenCollectionName(),
  usedGoogleJwtCollectionName: getUsedJwtCollectionName()
}