const app = require("express")();
const request = require("supertest");
const resource = require("../../src/restSchema");
const mongoose = require("../../src/mongoose");
const { expect } = require("chai");
const mongoosePaginate = require("mongoose-paginate-v2");
const bodyParser = require("body-parser");

// define temp model
const schema = new mongoose.Schema({
    name: String,
    hide1: String,
    hide2: String,
    boolean: Boolean,
    notUpdatable: String,
    custom: String
});
schema.plugin(mongoosePaginate);
const Model = mongoose.model("Schema5", schema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// define temp routes
app.use(
    "/default",
    resource({
        model: mongoose.model("Schema5"),
        fields: {
            name: {
                type: String
            },
            hide1: {
                type: String,
                hide: true
            },
            hide2: {
                type: String,
                hide: true
            }
        },
        routeKeys: ["name"]
    })
);

describe("delete route of schema resource", () => {
    beforeEach(async () => {
        await Model.deleteMany({});
    });

    it("it will return fields that are in schema", async () => {
        await Model.create({
            name: "name",
            hide1: "ok",
            hide2: "ok"
        });
        await request(app)
            .delete("/default/name")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.an("object");
                expect(response).to.haveOwnProperty("name");
                expect(response.name).to.be.equal("name");
                expect(response).to.not.haveOwnProperty("hide1");
                expect(response).to.not.haveOwnProperty("hide2");
            });
        const records = await Model.find({});
        expect(records).to.have.lengthOf(0);
    });

    it("will not return unSelected fields", async () => {
        await Model.create({
            name: "name",
            hide1: "ok",
            hide2: "ok"
        });
        await request(app)
            .delete("/default/name?select=-name")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.not.haveOwnProperty("name");
            });
    });
});
