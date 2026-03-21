export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 500, options?: ErrorOptions) {
    super(message, options);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export class UpstreamError extends AppError {
  constructor(message: string, statusCode = 502, options?: ErrorOptions) {
    super(message, statusCode, options);
    this.name = "UpstreamError";
  }
}
