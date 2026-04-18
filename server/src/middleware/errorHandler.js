export const notFoundHandler = (_req, res) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const payload = {
    message: error.message || "Internal server error"
  };

  if (process.env.NODE_ENV !== "production") {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};
