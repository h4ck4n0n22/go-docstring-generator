"use strict";
// import { expect } from "chai";
// import { generateDocstring } from "../extension";
const { expect } = require("chai");
const { generateDocstring } = require("../extension");
describe("generateDocstring", () => {
    it("should generate a dosctring for a function with arguments and no returns", () => {
        const input = "func TestFunc(arg1 string, arg2 int) {}";
        const result = generateDocstring(input);
        const expected = `/**
		* TestFunc: [Description]
		*
		* Args:
		*     arg1 (string): [Description]
		*     arg2 (int): [Description]
		*/`;
        expect(result).to.equal(expected);
    });
    it("should generate a docstring for a function with arguments and single return", () => {
        const input = "func GetID(name string) int {}";
        const result = generateDocstring(input);
        const expected = `/**
		* GetID: [Description]
		*
		* Args:
		*     name (string): [Description]
		* 
		* Returns:
		*     return1 (int): [Description]
		*/`;
        expect(result).to.equal(expected);
    });
    it("should generate a docstring for a function with no arguments and multiple returns", () => {
        const input = "func GetData() (map[string]interface{}, error) {}";
        const result = generateDocstring(input);
        const expected = `/**
		* GetData: [Description]
		*
		* Returns:
		*     return1 (map[string]interface{}): [Description]
		*     return2 (error): [Description]
		*/`;
        expect(result).to.equal(expected);
    });
    it("should generate a docstring for a function with no arguments and no returns", () => {
        const input = "func DoSomething() {}";
        const result = generateDocstring(input);
        const expected = `/**
		* DoSomething: [Description]
		*/`;
        expect(result).to.equal(expected);
    });
    it("should exclude invalid return types (e.g., '{')", () => {
        const input = "func InvalidFunc() ({, error) {}";
        const result = generateDocstring(input);
        const expected = `/**
		* InvalidFunc: [Description]
		*
		* Returns:
		*     return1 (error): [Description]
		*/`;
        expect(result).to.equal(expected);
    });
});
//# sourceMappingURL=extension.test.js.map