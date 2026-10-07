export class ApiError extends Error {
  status: number;
  /** The backend doesn't have this endpoint yet (see docs/FRONTEND_INTEGRATION_GUIDE.md). */
  notImplemented: boolean;
  constructor(status: number, message: string, notImplemented = false) {
    super(message);
    this.status = status;
    this.notImplemented = notImplemented;
    this.name = 'ApiError';
  }
}

export const isNotImplemented = (e: unknown) => e instanceof ApiError && e.notImplemented;
