const _ = require("lodash");
const deepRemove = require("omit-deep");

const makeNameFromStartNested = (items, fields) => {
    let result = [];
    for (let item of items) {
        if (!/\*/.test(item.value)) {
            result.push(item);
            continue;
        }
        let regexResult = /([^\*]+).\*(.*)/.exec(item.value);
        let nestedItems = _.get(fields, regexResult[1]);
        for (let index in nestedItems) {
            result.push({
                value: `${regexResult[1]}.${index}${regexResult[2]}`,
                shouldBeSelected: item.shouldBeSelected
            });
        }
    }
    if (result.filter(i => /\*/.test(i.value)).length) {
        result = makeNameFromStartNested(result, fields);
    }
    return result;
};

const getSelectFieldsList = (req, fields) => {
    let requestedFields = req.query.select;
    if (!requestedFields) {
        return [];
    }

    let selects = requestedFields.split(" ");

    let resultWithoutStartNested = [];

    for (let select of selects) {
        if (/^\-/.test(select)) {
            resultWithoutStartNested.push({
                shouldBeSelected: false,
                value: select.replace(/^-/, "")
            });
            continue;
        }
        resultWithoutStartNested.push({
            shouldBeSelected: true,
            value: select
        });
    }

    let result = makeNameFromStartNested(resultWithoutStartNested, fields);

    return result;
};

getOnlySelectFields = ({ fields, req }) => {
    fields = _.cloneDeep(fields);
    const selectedFields = getSelectFieldsList(req, fields);

    if (!selectedFields.length) {
        return fields;
    }
    if (selectedFields.filter(i => i.shouldBeSelected).length) {
        return _.pick(
            fields,
            selectedFields.filter(i => i.shouldBeSelected).map(i => i.value)
        );
    } else {
        for (let select of selectedFields) {
            fields = deepRemove(fields, select.value);
        }
    }
    return fields;
};

module.exports = getOnlySelectFields;
