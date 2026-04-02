type LogContext = Record<string, any>;

export function logInfo(message: string, context?: LogContext) {
  console.log(
    JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message,
      ...context,
    })
  );
}

export function logError(message: string, error: unknown, context?: LogContext) {
  const errorDetails =
    error instanceof Error
      ? {
          errorMessage: error.message,
          stack: error.stack,
        }
      : { error: String(error) };

  console.error(
    JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      message,
      ...errorDetails,
      ...context,
    })
  );
}

export function logWarning(message: string, context?: LogContext) {
  console.warn(
    JSON.stringify({
      level: "warn",
      timestamp: new Date().toISOString(),
      message,
      ...context,
    })
  );
}
