import { Request } from 'express-serve-static-core';

interface RequestWithUserInfo extends Request {
  userInfo: IUserInfo;
}
