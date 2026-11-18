import { existsSync } from "fs";
import path from "path";
import { UPDATE_STEPS } from "./updateAll";

const srcDir = path.resolve(__dirname, "../..");

describe("updateAll", () => {
    it.each(UPDATE_STEPS.map(step => [step.label, step.script]))(
        "step %s points to an existing script (%s)",
        (_label, script) => {
            expect(existsSync(path.join(srcDir, script))).toBe(true);
        }
    );

    it("runs the import with --auto-cleanup (no interactive confirm in cron)", () => {
        const importStep = UPDATE_STEPS.find(step => step.script.includes("trtImportCollecte"));
        expect(importStep?.args).toContain("--auto-cleanup");
    });

    it("refreshes views instead of the non-idempotent one-shot creation", () => {
        expect(UPDATE_STEPS.some(step => step.script.includes("oneshot"))).toBe(false);
    });
});
