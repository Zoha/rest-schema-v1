module.exports = (middleware, type) => {
    return [
        ...(middleware.global
            ? typeof middleware.global === "array"
                ? middleware.global
                : [middleware.global]
            : []),
        ...(middleware[type]
            ? typeof middleware[type] === "array"
                ? middleware[type]
                : [middleware[type]]
            : [])
    ];
};
