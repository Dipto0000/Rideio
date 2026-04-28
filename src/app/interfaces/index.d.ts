export enum Role {
  RIDER = 'Rider',
  DRIVER = 'Driver',
  ADMIN = 'Admin',
}

export interface IAuthUser {
  userId: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}

export {};