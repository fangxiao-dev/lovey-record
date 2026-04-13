const TRANSIENT_DATABASE_ERROR_CODES = new Set(['P1001', 'P1002', 'P1017', 'P2024']);

export function isTransientDatabaseError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const typedError = error as {
    code?: unknown;
    errorCode?: unknown;
    message?: unknown;
  };

  const code = typedError.code ?? typedError.errorCode;
  if (typeof code === 'string' && TRANSIENT_DATABASE_ERROR_CODES.has(code)) {
    return true;
  }

  if (typeof typedError.message === 'string') {
    return (
      typedError.message.includes("Can't reach database server") ||
      typedError.message.includes('timed out') ||
      typedError.message.includes('Server has closed the connection') ||
      typedError.message.includes('Timed out fetching a new connection from the connection pool')
    );
  }

  return false;
}

