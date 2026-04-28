import { IAuthUser } from '../middlewares/checkAuth.js';

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}

export {};