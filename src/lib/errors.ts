export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 500, options?: ErrorOptions) {
    super(message, options);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export class UpstreamError extends AppError {
  readonly upstreamStatus?: number;
  readonly upstreamBody?: string;

  constructor(
    message: string,
    statusCode = 502,
    options?: ErrorOptions & {
      upstreamStatus?: number;
      upstreamBody?: string;
    }
  ) {
    super(message, statusCode, options);
    this.name = "UpstreamError";
    this.upstreamStatus = options?.upstreamStatus;
    this.upstreamBody = options?.upstreamBody;
  }
}
