module.exports = (middleware, route) => {
  return [
    ...(middleware.global
      ? typeof middleware.global === "array"
        ? middleware.global
        : [middleware.global]
      : []),
    ...(middleware[route]
      ? typeof middleware[route] === "array"
        ? middleware[route]
        : [middleware[route]]
      : [])
  ];
};
