import { User } from '../routes/auth';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phone: string;
        role: string;
      };
    }
  }
}
