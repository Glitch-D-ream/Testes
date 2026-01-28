import { Request } from 'express';

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      userId?: string;
    }
  }
}
