import * as jwt from "jsonwebtoken";

interface RefreshTokenMeta {
  user: string,
  token: string,
}
interface GoogleJwtMeta {
  token: string,
  exp: number,
}
interface RefreshTokenPayload extends jwt.JwtPayload {
  userId: string, // user id is in format of `{id of platform}:{email}` for example: g:email@gmail.com
  picture: string,
  iss: string,
  iat: number,
  exp: number,
}
interface AccessTokenPayload extends jwt.JwtPayload {
  userId: string, // user id is in format of `{id of platform}:{email}` for example: g:email@gmail.com
  picture: string,
  iss: string,
  iat: number,
  exp: number,
  type: string,
}
// the google jwt has many more fields, only adding the needed ones here
interface GoogleJwtPayload extends jwt.JwtPayload {
  iss: string,
  email: string,
  email_verified: boolean,
  name: string,
  picture: string,
  given_name: string,
  family_name: string,
  exp: number,
}