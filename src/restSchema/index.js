const indexRouteModule = require("./routes/index");
const singleRouteModule = require("./routes/single");
const createRouteModule = require("./routes/create");
const updateRouteModule = require("./routes/update");
const deleteRouteModule = require("./routes/delete");
const countRouteModule = require("./routes/count");
const validateRouteModule = require("./routes/validate");
const collect = require('collect.js');
const ObjectId = require("mongoose").Schema.Types.ObjectId;

module.exports = (schema = {}) => {
    const router = require("express").Router();
    let defaultSchema = {
        fields: {},
        routes: ["index", "create", "delete", "update", "single"],
        paginationMeta: {
            defaultFilters: {
                isActive: { $ne: false },
                isDeleted: { $ne: true }
            },
            sort: "-createdAt",
            limit: 10,
            minLimit: 1,
            maxLimit: 50
        },
        filters: {},
        middleware: {
            global: []
        },
        routeKeys: ["id", "_id"],
        hooks: {}
    };
    const routeModules = {
        index: indexRouteModule,
        single: singleRouteModule,
        create: createRouteModule,
        update: updateRouteModule,
        delete: deleteRouteModule,
        count: countRouteModule,
        validate: validateRouteModule
    };

    // combine with default pagination meta because are required
    if (schema.paginationMeta) {
        schema.paginationMeta = {
            defaultFilters: {
                isActive: { $ne: false },
                isDeleted: { $ne: true }
            },
            sort: "-createdAt",
            limit: 10,
            minLimit: 1,
            maxLimit: 50,
            ...schema.paginationMeta
        };
    }

    // combine with default fields (_id and id)
    if (!schema.fields._id) {
        schema.fields._id = {
            type: ObjectId,
            creatable: false,
            updatable: false
        };
    }
    if (!schema.fields.id) {
        schema.fields.id = {
            type: Number,
            creatable: false,
            updatable: false
        };
    }

    schema = { ...defaultSchema, ...schema };

    if(schema.routes.filter(i => i === 'count').length){
        schema.routes = collect(schema.routes).sort((a, b) => a == 'count' ? 10 : 1).all();
    }
    for (let route of schema.routes) {
        if (routeModules[route]) {
            router.use(routeModules[route](schema));
        }
    }

    return router;
};
