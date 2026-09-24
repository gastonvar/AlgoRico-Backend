declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string;
        companyId: string;
        sessionId: string;
        sessionToken: string;
      };
    }
  }
}

export {};
