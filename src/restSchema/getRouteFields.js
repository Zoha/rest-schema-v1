const _ = require("lodash");

const getRouteFields = (originalFields, type) => {
    let fields = _.cloneDeep(originalFields);
    let routeFields = {};
    for (let fieldKey in fields) {
        let field = fields[fieldKey];

        if (
            typeof field.hide === "undefined" ||
            (typeof field.hide === "boolean" && field.hide !== true) ||
            (typeof field.hide !== "boolean" &&
                !field.hide[type] &&
                !field.hide.global)
        ) {
            routeFields[fieldKey] = field;
            if (field.isBranched) {
                routeFields[fieldKey].branches = getRouteFields(
                    field.branches,
                    type
                );
            }
        }
    }
    return routeFields;
};

module.exports = getRouteFields;
