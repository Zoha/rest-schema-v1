module.exports = async (hook, { schema, type, ...other }) => {
    let promises = [];
    if (schema.hooks.global && schema.hooks.global[hook]) {
        promises.push(schema.hooks.global[hook]({ schema, type, ...other }));
    }
    if (schema.hooks[type] && schema.hooks[type][hook]) {
        promises.push(schema.hooks[type][hook]({ schema, type, ...other }));
    }
    if (promises.length) {
        return await Promise.all(promises);
    }
};
