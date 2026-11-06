import { Request } from 'express';

import { JwtPayload } from './jwt-payload.type';

export interface ApiRequest extends Request {
  user: JwtPayload;
}
