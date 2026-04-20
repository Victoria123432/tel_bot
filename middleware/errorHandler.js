const { winstonLogger } = require("./logger");

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  winstonLogger.error(
    `[${req.method} ${req.originalUrl}] ${status} — ${message}`,
  );
  if (err.stack) winstonLogger.error(err.stack);

  res.status(status).json({
    success: false,
    error: {
      status,
      message,
    },
  });
}

module.exports = errorHandler;
