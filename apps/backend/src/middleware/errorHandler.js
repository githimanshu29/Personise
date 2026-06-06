export function globalErrorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (res.headersSent) return next(err);
  res.status(status).json({
    error: err.code || "INTERNAL_ERROR",
    message:
      status === 500 ? "Something went wrong. Please try again." : err.message,
    request_id: req.id,
  });
}
