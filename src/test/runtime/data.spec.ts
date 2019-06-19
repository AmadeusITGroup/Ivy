import * as assert from 'assert';
import { ζΔD, ζΔp } from '../../iv';
import { changeComplete, isMutating, commitChanges, watch, unwatch } from '../../trax/trax';

describe('Data', () => {
    @ζΔD class ζParams {
        ΔΔname1: any; @ζΔp() name1: any;
        ΔΔname2: any; @ζΔp() name2: any;
    }

    it("should identify changes", function () {
        let d = new ζParams();

        assert.equal(isMutating(d), false, "d unchanged after creation");
        d.name1 = "";
        assert.equal(isMutating(d), true, "change 1");
        commitChanges(d);
        assert.equal(isMutating(d), false, "reset 1");
        d.name2 = "abc";
        assert.equal(isMutating(d), true, "change 2");
    });

    it("should support main observer", async function () {
        let changeCount = 0, changeParam: any;

        function watchFn(d: any) {
            changeCount++;
            changeParam = d;
        }

        let d = new ζParams();
        watch(d, watchFn);

        assert.equal(changeCount, 0, "no changes notified at init");
        assert.equal(isMutating(d), false, "d unchanged after creation");

        d.name1 = "N1";
        d.name2 = "N2";

        assert.equal(isMutating(d), true, "d changed");

        await changeComplete(d);
        assert.equal(changeCount, 1, "change notified");
        assert.equal(changeParam, d, "d passed as notification parameter");
        assert.equal(isMutating(d), false, "d back to unchanged");
    });

    it("should not notify when main observer is disconnected", async function () {
        let changeCount = 0, changeParam: any;

        function watchFn(d: any) {
            changeCount++;
            changeParam = d;
        }

        let d = new ζParams();
        watch(d, watchFn);

        assert.equal(changeCount, 0, "no changes notified at init");
        assert.equal(isMutating(d), false, "d unchanged after creation");

        unwatch(d, watchFn);
        d.name1 = "N1";
        d.name2 = "N2";

        assert.equal(isMutating(d), true, "d changed");

        await changeComplete(d);
        watch(d, watchFn);
        assert.equal(changeCount, 0, "no changes notified");
        assert.equal(isMutating(d), false, "d back to unchanged");
    });
});
