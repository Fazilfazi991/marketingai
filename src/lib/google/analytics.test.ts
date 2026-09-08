import {describe,expect,it} from "vitest";import {numeric} from "./normalize";
describe("Google metric normalization",()=>{it("normalizes metric values",()=>{expect(numeric("42.5")).toBe(42.5);expect(numeric(undefined)).toBe(0);expect(numeric("bad")).toBe(0)})});
