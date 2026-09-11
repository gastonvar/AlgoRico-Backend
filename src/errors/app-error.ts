export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;
  readonly expose: boolean;

  constructor(options: {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
    expose?: boolean;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = 'AppError';
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
    this.expose = options.expose ?? options.statusCode < 500;
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError({ statusCode: 400, code: 'BAD_REQUEST', message, details });
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError({ statusCode: 401, code: 'UNAUTHORIZED', message });
  }

  static forbidden(message = 'You are not allowed to perform this action'): AppError {
    return new AppError({ statusCode: 403, code: 'FORBIDDEN', message });
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError({ statusCode: 404, code: 'NOT_FOUND', message });
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError({ statusCode: 409, code: 'CONFLICT', message, details });
  }

  static validation(message: string, details?: unknown): AppError {
    return new AppError({ statusCode: 422, code: 'VALIDATION_ERROR', message, details });
  }

  static payloadTooLarge(message = 'File is too large'): AppError {
    return new AppError({ statusCode: 413, code: 'PAYLOAD_TOO_LARGE', message });
  }
}
