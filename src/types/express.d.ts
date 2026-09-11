declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string;
        sessionId: string;
        sessionToken: string;
      };
    }
  }
}

export {};
