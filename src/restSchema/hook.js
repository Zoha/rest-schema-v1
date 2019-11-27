module.exports = async (hook, { schema, route, ...other }) => {
  let promises = [];
  if (schema.hooks.global && schema.hooks.global[hook]) {
    promises.push(schema.hooks.global[hook]({ schema, route, ...other }));
  }
  if (schema.hooks[route] && schema.hooks[route][hook]) {
    promises.push(schema.hooks[route][hook]({ schema, route, ...other }));
  }
  if (promises.length) {
    return await Promise.all(promises);
  }
};
