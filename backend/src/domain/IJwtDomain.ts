interface IJwtDomain {
  generateAccessToken: (data: IUserInfo) => string,
  generateRefreshToken: (data: IUserInfo) => string,
  verifyRefreshToken: (token: string) => Promise<boolean>,
  verifyAccessToken: (token: string) => boolean,
  verifyGoogleJwt: (token: string) => Promise<boolean>,
}
