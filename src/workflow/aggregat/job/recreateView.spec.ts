jest.mock("../../_common/infrastructure/db/pool", () => ({ writerPool: { query: jest.fn(), end: jest.fn() } }));
jest.mock("../../_common/infrastructure/db/sqlRunner", () => ({ runSqlFile: jest.fn() }));
jest.mock("../registry", () => ({
    VIEW_REGISTRY: {
        mv_zeta: { domain: "groups", sqlPath: "zeta.sql" },
        agg_alpha: { domain: "acteurs", sqlPath: "alpha.sql" },
        Agg_beta: { domain: "acteurs", sqlPath: "beta.sql" },
    },
}));

import { Logger } from "../../../utils/logger";
import { writerPool } from "../../_common/infrastructure/db/pool";
import { runSqlFile } from "../../_common/infrastructure/db/sqlRunner";
import { main } from "./recreateView";

describe("recreateView (arguments)", () => {
    const argv = process.argv;
    let info: jest.SpyInstance;

    beforeEach(() => {
        process.exitCode = undefined;
        jest.clearAllMocks();
        info = jest.spyOn(Logger.prototype, "info").mockImplementation(() => {});
        jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
        jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        process.argv = argv;
        process.exitCode = undefined;
        jest.restoreAllMocks();
    });

    const run = async (...args: string[]) => {
        process.argv = ["node", "recreateView.ts", ...args];
        await main();
    };

    it("sans nom de vue : échoue et liste les vues connues, triées", async () => {
        await run();

        expect(process.exitCode).toBe(1);
        expect(info).toHaveBeenCalledWith("Vues connues : agg_alpha, Agg_beta, mv_zeta");
        expect(writerPool.query).not.toHaveBeenCalled();
    });

    it("vue inconnue : échoue, liste les vues connues, ne touche à rien", async () => {
        await run("mv_inconnue", "--yes");

        expect(process.exitCode).toBe(1);
        expect(info).toHaveBeenCalledWith("Vues connues : agg_alpha, Agg_beta, mv_zeta");
        expect(writerPool.query).not.toHaveBeenCalled();
        expect(runSqlFile).not.toHaveBeenCalled();
    });

    it("sans --yes : dry-run, aucune action", async () => {
        await run("agg_alpha");

        expect(process.exitCode).toBeUndefined();
        expect(writerPool.query).not.toHaveBeenCalled();
        expect(runSqlFile).not.toHaveBeenCalled();
    });
});
