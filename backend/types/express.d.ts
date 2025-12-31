import { IUser } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

interface AuthenticatedRequest extends Express.Request {
  user: {
    userId: string;
    role: string;
  };
}

export {};