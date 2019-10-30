const app = require("express")();
const request = require("supertest");
const resource = require("../../src/restSchema");
const mongoose = require("../../src/mongoose");
const { expect } = require("chai");
const mongoosePaginate = require("mongoose-paginate-v2");
const bodyParser = require("body-parser");

// define temp model
const schema = new mongoose.Schema({
    name: String
});
schema.plugin(mongoosePaginate);
const Model = mongoose.model("Schema7", schema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// define temp routes
app.use(
    "/default",
    resource({
        model: mongoose.model("Schema7"),
        fields: {
            name: {
                type: String,
                unique: true,
                validate: val => val === "name",
                validationRoute: true
            }
        },

        routes: ["validate"]
    })
);

describe("validate route of schema resource", () => {
    beforeEach(async () => {
        await Model.deleteMany({});
    });

    it("it will validate input by validate route", async () => {
        await request(app)
            .post("/default/validate")
            .expect(404);
        await request(app)
            .post("/default/validate/test")
            .expect(404);
        await request(app)
            .post("/default/validate/name")
            .expect(400);
        await request(app)
            .post("/default/validate/name")
            .send({
                name: "invalid"
            })
            .expect(400);
        await request(app)
            .post("/default/validate/name")
            .send({
                name: "name"
            })
            .expect(200);
        await Model.create({
            name: "name"
        });
        await request(app)
            .post("/default/validate/name")
            .send({
                name: "name"
            })
            .expect(400);
    });
});
