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
    notCreatable: String,
    custom: String,
    array: Array,
    array2: Array,
    object: Object
});
schema.plugin(mongoosePaginate);
const Model = mongoose.model("Schema3", schema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// define temp routes
app.use(
    "/default",
    resource({
        model: mongoose.model("Schema3"),
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
            notCreatable: {
                type: String,
                creatable: false,
                get: "something"
            },
            custom: {
                type: String,
                set: "custom_name",
                get: "custom_name"
            }
        },
        routeKeys: ["name"]
    })
);

app.use(
    "/default2",
    resource({
        model: mongoose.model("Schema3"),
        fields: {
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
                            notCreatable: {
                                type: String,
                                get: val => "ok",
                                creatable: false
                            }
                        }
                    }
                ]
            },
            array2: {
                type: [
                    {
                        type: {
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
                                            notCreatable: {
                                                type: String,
                                                get: val => "ok",
                                                creatable: false
                                            }
                                        }
                                    }
                                ],
                                required: true
                            }
                        }
                    }
                ]
            }
        }
    })
);

describe("create route of schema resource", () => {
    beforeEach(async () => {
        await Model.deleteMany({});
    });

    it("it will return fields that are in schema", async () => {
        await request(app)
            .post("/default")
            .send({
                name: "name",
                boolean: "string",
                notCreatable: "something"
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.an("object");
                expect(response).to.haveOwnProperty("name");
                expect(response.name).to.be.equal("name");
                expect(response).to.haveOwnProperty("custom");
                expect(response.custom).to.be.equal("custom_name");
                expect(response)
                    .to.haveOwnProperty("notCreatable")
                    .that.equals("something");
            });
        const records = await Model.find({});
        expect(records).to.have.lengthOf(1);
        records[0] = records[0].toObject();
        expect(records[0]).to.haveOwnProperty("custom");
        expect(records[0].custom).to.be.equals("custom_name");
        expect(records[0])
            .to.haveOwnProperty("name")
            .that.equals("name");
        expect(records[0])
            .to.haveOwnProperty("boolean")
            .that.is.a("boolean")
            .and.equal(true);
        expect(records[0]).to.not.haveOwnProperty("notCreatable");
    });

    it("will validate type of branched array value", async () => {
        await request(app)
            .post("/default2")
            .send({
                array: [
                    {
                        name: "invalid"
                    }
                ]
            })
            .expect(400);
        await request(app)
            .post("/default2")
            .send({
                array: [
                    {
                        name: "name",
                        other: "something",
                        notCreatable: "something"
                    },
                    {
                        name: "name2",
                        other: "something2",
                        notCreatable: "something2"
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
                expect(response.array[0]).to.haveOwnProperty("notCreatable");
                expect(response.array[0].notCreatable).to.be.equal("ok");
                expect(response.array[0]).to.not.haveOwnProperty("other");

                expect(response.array[1]).to.haveOwnProperty("name");
                expect(response.array[1].name).to.be.equal("name2");
                expect(response.array[1]).to.haveOwnProperty("notCreatable");
                expect(response.array[1].notCreatable).to.be.equal("ok");
                expect(response.array[1]).to.not.haveOwnProperty("other");
            });
        const records = await Model.find({});
        const record = records[0].toObject();

        expect(records).to.have.lengthOf(1);
        expect(record).to.haveOwnProperty("array");
        expect(record.array).to.have.lengthOf(2);
        expect(record.array[0]).to.haveOwnProperty("name");
        expect(record.array[0]).to.not.haveOwnProperty("notCreatable");
        expect(record.array[1]).to.haveOwnProperty("name");
        expect(record.array[1]).to.not.haveOwnProperty("notCreatable");
    });

    it("will convert object to array for array field", async () => {
        await request(app)
            .post("/default2")
            .send({
                array: {
                    name: "name",
                    other: "something",
                    notCreatable: "something"
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
                expect(response.array[0]).to.haveOwnProperty("notCreatable");
                expect(response.array[0].notCreatable).to.be.equal("ok");
                expect(response.array[0]).to.not.haveOwnProperty("other");
            });
        const records = await Model.find({});
        const record = records[0].toObject();

        expect(records).to.have.lengthOf(1);
        expect(record).to.haveOwnProperty("array");
        expect(record.array[0]).to.haveOwnProperty("name");
        expect(record.array[0]).to.not.haveOwnProperty("notCreatable");
    });

    it("will validate type of branched array value for 2 level up", async () => {
        await request(app)
            .post("/default2")
            .send({
                array2: [
                    {
                        array: [
                            {
                                name: "invalid"
                            }
                        ]
                    }
                ]
            })
            .expect(400);
        await request(app)
            .post("/default2")
            .send({
                array2: [
                    {
                        array: [
                            {
                                name: "name",
                                other: "something",
                                notCreatable: "something"
                            }
                        ]
                    }
                ]
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.an("object");
                expect(response).to.haveOwnProperty("array2");
                expect(response.array2).to.be.an("array");
                expect(response.array2).to.have.lengthOf(1);
                expect(response.array2[0]).to.haveOwnProperty("array");
                expect(response.array2[0].array).to.be.an("array");
                expect(response.array2[0].array).to.have.lengthOf(1);
                expect(response.array2[0].array[0].name).to.be.equal("name");
                expect(response.array2[0].array[0]).to.haveOwnProperty(
                    "notCreatable"
                );
                expect(response.array2[0].array[0].notCreatable).to.be.equal(
                    "ok"
                );
                expect(response.array2[0].array[0]).to.not.haveOwnProperty(
                    "other"
                );
            });
        const records = await Model.find({});
        const record = records[0].toObject();

        expect(records).to.have.lengthOf(1);
        expect(record).to.haveOwnProperty("array2");
        expect(record.array2[0]).to.haveOwnProperty("array");
        expect(record.array2[0].array[0]).to.haveOwnProperty("name");
        expect(record.array2[0].array[0]).to.not.haveOwnProperty(
            "notCreatable"
        );
    });

    it("will return selected fields", async () => {
        await request(app)
            .post("/default?select=name")
            .send({
                name: "name",
                boolean: "string",
                notCreatable: "something"
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.an("object");
                expect(response).to.haveOwnProperty("name");
                expect(response.name).to.be.equal("name");
                expect(response).to.not.haveOwnProperty("custom");
                expect(response).to.not.haveOwnProperty("notCreatable");
            });
    });
});
