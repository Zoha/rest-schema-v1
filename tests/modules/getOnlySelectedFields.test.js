const getOnlySelectedFields = require("../../src/restSchema/getOnlySelectedFields");
const { expect } = require("chai");

describe("get only selected fields", () => {
    it("will return only selected fields", () => {
        let fields = {
            name: "name",
            number: 5,
            object: {
                name: "name",
                array: [
                    {
                        name: "ok",
                        name2: "ok2"
                    },
                    "nok"
                ]
            },
            array: [
                {
                    array: ["ok", "nok"]
                },
                {
                    array: ["ok", "nok"]
                }
            ]
        };

        let select1 = getOnlySelectedFields({
            req: { query: { select: "object.name" } },
            fields
        });

        expect(select1)
            .to.haveOwnProperty("object")
            .and.to.not.haveOwnProperty("number");
        expect(select1.object)
            .to.haveOwnProperty("name")
            .and.to.not.haveOwnProperty("array");

        let select2 = getOnlySelectedFields({
            req: { query: { select: "object.array.0.name" } },
            fields
        });

        expect(select2.object)
            .to.haveOwnProperty("array")
            .and.to.not.haveOwnProperty("name");

        expect(select2.object.array[0]).to.haveOwnProperty("name");

        let select3 = getOnlySelectedFields({
            req: {
                query: { select: "object.array.0.name object.array.0.name2" }
            },
            fields
        });

        expect(select3.object.array[0]).to.haveOwnProperty("name");
        expect(select3.object.array[0]).to.haveOwnProperty("name2");

        let select4 = getOnlySelectedFields({
            req: {
                query: { select: "array.*.array.*" }
            },
            fields
        });

        expect(select4.array).to.have.lengthOf(2);
        expect(select4.array[0]).to.haveOwnProperty("array");
        expect(select4.array[0].array).to.have.lengthOf(2);
    });

    it("will not return unselected fields", () => {
        let fields = {
            name: "name",
            number: 5,
            object: {
                name: "name",
                array: [
                    {
                        name: "ok",
                        name2: "ok2"
                    },
                    "nok"
                ]
            }
        };

        let select1 = getOnlySelectedFields({
            req: { query: { select: "-object.name" } },
            fields
        });

        expect(select1).to.haveOwnProperty("name");
        expect(select1.object)
            .to.haveOwnProperty("array")
            .and.to.not.haveOwnProperty("name");

        let select2 = getOnlySelectedFields({
            req: { query: { select: "-object.array.0.name" } },
            fields
        });

        expect(select2.object).to.haveOwnProperty("array");
        expect(select2.object).to.haveOwnProperty("name");

        expect(select2.object.array[0])
            .to.haveOwnProperty("name2")
            .and.to.not.haveOwnProperty("name");

        let select3 = getOnlySelectedFields({
            req: {
                query: { select: "object.array.0.name -object.array.0.name2" }
            },
            fields
        });

        expect(select3).to.not.haveOwnProperty("name");
        expect(select3.object.array[0]).to.haveOwnProperty("name");
        expect(select3.object.array[0]).to.not.haveOwnProperty("name2");

        let select4 = getOnlySelectedFields({
            req: {
                query: { select: "-object.array.0.name -object.array.0.name2" }
            },
            fields
        });

        expect(select4).to.haveOwnProperty("name");
        expect(select4.object).to.haveOwnProperty("name");
        expect(select4.object.array[0]).to.not.haveOwnProperty("name");
        expect(select4.object.array[0]).to.not.haveOwnProperty("name2");

        let select5 = getOnlySelectedFields({
            req: {
                query: { select: "-object.*" }
            },
            fields
        });

        expect(select5).to.haveOwnProperty("name");
        expect(select5).to.haveOwnProperty("object");
        expect(select5.object).to.not.haveOwnProperty("name");
        expect(select5.object).to.not.haveOwnProperty("array");
    });
});
