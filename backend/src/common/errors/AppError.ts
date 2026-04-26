/**
 * Custom application error that carries an HTTP status code.
 * Thrown by services and middleware to signal expected failure
 * conditions (e.g. 400 Bad Request, 401 Unauthorized, 404 Not Found).
 * The global error handler converts instances of this class into
 * structured JSON responses.
 */
export class AppError extends Error {
  /** HTTP status code to send in the response. */
  statusCode: number;

  /**
   * Creates a new AppError.
   *
   * @param message - Human-readable description of the error.
   * @param statusCode - HTTP status code (defaults to 500).
   */
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
