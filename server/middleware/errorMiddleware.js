function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  if (err.name === "MulterError" || /file type|files are allowed/i.test(err.message)) statusCode = 400;
  if (err.name === "CastError") statusCode = 400;
  if (err.name === "ValidationError") statusCode = 400;

  res.status(statusCode).json({
    msg: err.message,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
}

module.exports = { notFound, errorHandler };
