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
    custom: String,
    array: []
});
schema.plugin(mongoosePaginate);
const Model = mongoose.model("Schema4", schema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// define temp routes
app.use(
    "/default",
    resource({
        model: mongoose.model("Schema4"),
        fields: {
            name: {
                type: String
            },
            hide1: {
                type: String,
                hide: {
                    global: true
                }
            },
            hide2: {
                type: String,
                hide: {
                    single: true
                }
            },
            boolean: {
                type: Boolean
            },
            notUpdatable: {
                type: String,
                updatable: false,
                get: "something"
            },
            custom: {
                type: String,
                get: "custom_name",
                set: "custom_name"
            }
        },
        routeKeys: ["name"]
    })
);

app.use(
    "/default2",
    resource({
        model: mongoose.model("Schema4"),
        fields: {
            name: String,
            array: {
                type: [
                    {
                        type: {
                            name: {
                                type: String,
                                validate: val => val === "name",
                                required: true
                            },
                            score: {
                                type: Number,
                                set: val => val || 0
                            },
                            other: {
                                type: String,
                                hide: true,
                                get: val => "ok"
                            },
                            notUpdatable: {
                                type: String,
                                get: val => "ok",
                                updatable: false
                            }
                        }
                    }
                ],
                required: true
            }
        },
        routeKeys: ["name"]
    })
);

describe("update route of schema resource", () => {
    beforeEach(async () => {
        await Model.deleteMany({});
    });

    it("it will return fields that are in schema", async () => {
        await Model.create({
            name: "name",
            boolean: false,
            notUpdatable: "something"
        });
        await request(app)
            .put("/default/name")
            .send({
                name: "name2",
                boolean: "string",
                notUpdatable: "something2"
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.an("object");
                expect(response).to.haveOwnProperty("name");
                expect(response.name).to.be.equal("name2");
                expect(response).to.haveOwnProperty("custom");
                expect(response.custom).to.be.equal("custom_name");
                expect(response)
                    .to.haveOwnProperty("notUpdatable")
                    .that.equals("something");
            });
        const records = await Model.find({});
        expect(records).to.have.lengthOf(1);
        records[0] = records[0].toObject();
        expect(records[0]).to.haveOwnProperty("custom");
        expect(records[0].custom).to.be.equals("custom_name");
        expect(records[0])
            .to.haveOwnProperty("name")
            .that.equals("name2");
        expect(records[0])
            .to.haveOwnProperty("boolean")
            .that.is.a("boolean")
            .and.equal(true);
        expect(records[0])
            .to.haveOwnProperty("notUpdatable")
            .that.equals("something");
    });

    it("will validate type of branched array value", async () => {
        await Model.create({
            name: "name",
            boolean: false,
            array: [
                {
                    name: "something",
                    other: "somethingElse",
                    notUpdatable: "something"
                }
            ]
        });
        await request(app)
            .put("/default2/name")
            .send({
                array: [
                    {
                        name: "invalid"
                    }
                ]
            })
            .expect(400);
        await request(app)
            .put("/default2/name")
            .send({
                array: [
                    {
                        name: "name",
                        other: "something",
                        notUpdatable: "somethingELSE"
                    },
                    {
                        name: "name2",
                        other: "something2",
                        notUpdatable: "somethingELSE2"
                    }
                ]
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.an("object");
                expect(response).to.haveOwnProperty("array");
                expect(response.array).to.be.an("array");
                expect(response.array).to.have.lengthOf(2);
                expect(response.array[0]).to.haveOwnProperty("name");
                expect(response.array[0].name).to.be.equal("name");
                expect(response.array[0]).to.not.haveOwnProperty("other");
                expect(response.array[1]).to.haveOwnProperty("name");
                expect(response.array[1].name).to.be.equal("name2");
                expect(response.array[1]).to.not.haveOwnProperty("other");
            });
        const records = await Model.find({});
        const record = records[0].toObject();

        expect(records).to.have.lengthOf(1);
        expect(record).to.haveOwnProperty("array");
        expect(record.array).to.have.lengthOf(2);
        expect(record.array[0]).to.haveOwnProperty("name");
        expect(record.array[0]).to.not.haveOwnProperty("notUpdatable");
        expect(record.array[1]).to.haveOwnProperty("name");
        expect(record.array[1]).to.not.haveOwnProperty("notUpdatable");
    });

    it("will convert object to array for array field", async () => {
        await Model.create({
            name: "name",
            boolean: false,
            array: [
                {
                    name: "something",
                    other: "somethingElse",
                    notUpdatable: "something"
                }
            ]
        });
        await request(app)
            .put("/default2/name")
            .send({
                array: {
                    name: "name",
                    other: "something",
                    notUpdatable: "somethingELSE"
                }
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.an("object");
                expect(response).to.haveOwnProperty("array");
                expect(response.array).to.be.an("array");
                expect(response.array).to.have.lengthOf(1);
                expect(response.array[0]).to.haveOwnProperty("name");
                expect(response.array[0].name).to.be.equal("name");
                expect(response.array[0]).to.not.haveOwnProperty("other");
            });
        const records = await Model.find({});
        const record = records[0].toObject();

        expect(records).to.have.lengthOf(1);
        expect(record).to.haveOwnProperty("array");
        expect(record.array[0]).to.haveOwnProperty("name");
        expect(record.array[0]).to.not.haveOwnProperty("notUpdatable");
    });

    it("it will not return unselected fields after update", async () => {
        await Model.create({
            name: "name",
            boolean: false,
            notUpdatable: "something"
        });
        await request(app)
            .put("/default/name?select=-name")
            .send({
                name: "name2",
                boolean: "string",
                notUpdatable: "something2"
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.an("object");
                expect(response).to.not.haveOwnProperty("name");
                expect(response).to.haveOwnProperty("custom");
                expect(response).to.haveOwnProperty("notUpdatable");
            });
    });
});
