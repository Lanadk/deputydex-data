import fs from "fs";
import os from "os";
import path from "path";
import { purgeOldZipDirs } from "./purgeOldDownloads";

describe("purgeOldZipDirs", () => {
    let zipDir: string;

    const mkSession = (name: string) => {
        fs.mkdirSync(path.join(zipDir, name, "17"), { recursive: true });
        fs.writeFileSync(path.join(zipDir, name, "17", "acteurs.zip"), "x");
    };
    const remaining = () => fs.readdirSync(zipDir).sort();

    beforeEach(() => {
        zipDir = fs.mkdtempSync(path.join(os.tmpdir(), "purge-zip-"));
    });

    afterEach(() => {
        fs.rmSync(zipDir, { recursive: true, force: true });
    });

    it("keeps only the N most recent timestamped session dirs", () => {
        const sessions = [
            "2026-11-18_05-00-01",
            "2026-11-19_05-00-02",
            "2026-11-20_05-00-03",
            "2026-11-21_05-00-04",
        ];
        // Créés dans le désordre : seul le nom compte, pas l'ordre de création.
        [...sessions].reverse().forEach(mkSession);

        const deleted = purgeOldZipDirs(zipDir, 2);

        expect(deleted).toEqual(["2026-11-18_05-00-01", "2026-11-19_05-00-02"]);
        expect(remaining()).toEqual(["2026-11-20_05-00-03", "2026-11-21_05-00-04"]);
    });

    it("deletes nothing when there are no more dirs than the limit", () => {
        mkSession("2026-11-20_05-00-03");

        expect(purgeOldZipDirs(zipDir, 7)).toEqual([]);
        expect(remaining()).toEqual(["2026-11-20_05-00-03"]);
    });

    it("ignores entries that are not timestamped session dirs", () => {
        mkSession("2026-11-18_05-00-01");
        mkSession("2026-11-19_05-00-02");
        fs.mkdirSync(path.join(zipDir, "manuel"));
        fs.writeFileSync(path.join(zipDir, "2026-01-01_00-00-00"), "a file, not a dir");

        const deleted = purgeOldZipDirs(zipDir, 1);

        expect(deleted).toEqual(["2026-11-18_05-00-01"]);
        expect(remaining()).toEqual(["2026-01-01_00-00-00", "2026-11-19_05-00-02", "manuel"]);
    });

    it("returns an empty list when the zip dir does not exist", () => {
        expect(purgeOldZipDirs(path.join(zipDir, "absent"))).toEqual([]);
    });

    it("refuses a keep below 1 (would wipe every download)", () => {
        expect(() => purgeOldZipDirs(zipDir, 0)).toThrow();
    });
});
