import * as assert from 'assert';
import { compile } from '../compiler/compiler';

describe('Template compiler', () => {

    it("should compile a single function with no params", async function () {
        let src1 = `\// start
            import { template } from "../iv";

            let x = template(\`() => {
                # hello world #
            }\`);

            // end`;

        let r = await compile(src1, "test1")

        assert.equal(r, `\// start
            import { template, ζcc, ζend, ζtxt, ζt } from "../iv";

            let x = (function () {
            return ζt(function (ζ) {
                if (ζ[0].cm) {
                    ζtxt(ζ, 1, 1, 0, " hello world ");
                }
                ζend(ζ, 0);
            });
            })();

            // end`, "test 1");
    });

    it("should compile a multiple functions with params and partial imports", async function () {
        let src2 = `\
            import{ template, ζtxt } from "../iv";

            let t1 = template(\`(a) => {
                # T1 #
            }\`);
            let x = 123, t2 = template(\`(p1:string, p2:number) => {
                # T1 #
            }\`);
            let z = "ABCD";
            `;

        let r = await compile(src2, "test2")

        assert.equal(r, `\
            import{ template, ζtxt, ζcc, ζend, ζv, ζd, ζt } from "../iv";

            let t1 = (function () {
            @ζd class ζParams {
                @ζv a;
            }
            return ζt(function (ζ, $) {
                let a = $["a"];
                if (ζ[0].cm) {
                    ζtxt(ζ, 1, 1, 0, " T1 ");
                }
                ζend(ζ, 0);
            }, 0, ζParams);
            })();
            let x = 123, t2 = (function () {
            @ζd class ζParams {
                @ζv p1;
                @ζv p2;
            }
            return ζt(function (ζ, $) {
                let p1 = $["p1"], p2 = $["p2"];
                if (ζ[0].cm) {
                    ζtxt(ζ, 1, 1, 0, " T1 ");
                }
                ζend(ζ, 0);
            }, 0, ζParams);
            })();
            let z = "ABCD";
            `, "test 2");
    });

    it("should skipped files marked with iv:ignore comment", async function () {
        let src = `
            // iv:ignore
            import{ template, ζtxt } from "../iv";

            let t1 = template(\`(a) => {
                # T1 #
            }\`);
            let x = 123, t2 = template(\`(p1:string, p2:number) => {
                # T1 #
            }\`);
            let z = "ABCD";
            `;
        let r = await compile(src, "test3")
        assert.equal(r, src, "test 3");
    });

    it("should not change files that don't contain templates", async function () {
        let src = `let x=123;`;
        let r = await compile(src, "test3")
        assert.equal(r, src, "test 3");
    });

    it("should raise errors with file name and line numbers", async function () {
        let errMsg = "";
        try {
            await compile(` import{ template } from "../iv";
    
                            let t = template(\`(a) => {
                                # T1 
                            }\`);
                            `, "file-name.ts")
        } catch (e) {
            errMsg = e.message
        }
        assert.equal(errMsg, 'Invalid text node - Unexpected end of template at line #5 in file-name.ts', "error 1");

        try {
            await compile(` import{ template } from "../iv";
    
                            let t = template(\`(a) => {
                                <! foo="bar">
                                    # Hello #
                                </>
                            }\`);
                            `, "file-name.ts")
        } catch (e) {
            errMsg = e.message
        }
        assert.equal(errMsg, 'Invalid fragment - Params cannot be used on fragments at line #4 in file-name.ts', "error 2");
    });

});