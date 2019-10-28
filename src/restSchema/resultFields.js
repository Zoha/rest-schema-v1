const convert = require("../typeConverter");

const getResultFromRecord = async (
    req,
    routeFields,
    type,
    record,
    schema,
    fields,
    isArray = false
) => {
    let result = {};
    if (isArray) {
        result = [];
    }
    for (let fieldName in routeFields) {
        const field = routeFields[fieldName];
        let value;

        if (record && record[fieldName]) {
            value = convert(record[fieldName]).to(field.type || String);
        }
        if (value && field.isBranched) {
            let branches = field.branches;
            if (field.isArrayBranched) {
                branches = [];
                for (let i = 0; i < value.length; i++) {
                    branches.push(field.branches[0]);
                }
            }
            value = await getResultFromRecord(
                req,
                branches,
                type,
                value,
                schema,
                fields,
                !!field.isArrayBranched
            );
        }
        if (field.get) {
            if (typeof field.get === "function") {
                value = await field.get(value, {
                    req,
                    schema: schema,
                    fields: fields,
                    record: record,
                    type: type
                });
            } else {
                value = field.get;
            }
        } else if (!value && field.required) {
            throw new Error(`${fieldName} not exists in record`);
        }
        result[fieldName] = value;
    }
    return result;
};

module.exports = getResultFromRecord;
