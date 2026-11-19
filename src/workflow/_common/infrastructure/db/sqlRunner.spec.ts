import { grantSelectToReader, SqlExecutor } from "./sqlRunner";

function mockExecutor() {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    return { executor: { query } as unknown as SqlExecutor, query };
}

describe("grantSelectToReader", () => {
    it("grants SELECT on the view to the reader role, with quoted identifiers", async () => {
        const { executor, query } = mockExecutor();

        await expect(grantSelectToReader(executor, "mv_groupes_presidents", "user_app_reader")).resolves.toBe("user_app_reader");
        expect(query).toHaveBeenCalledWith('GRANT SELECT ON "mv_groupes_presidents" TO "user_app_reader";');
    });

    it("escapes double quotes in identifiers", async () => {
        const { executor, query } = mockExecutor();

        await grantSelectToReader(executor, 'a"b', "reader");
        expect(query).toHaveBeenCalledWith('GRANT SELECT ON "a""b" TO "reader";');
    });

    it("does nothing and returns null when no reader role is configured", async () => {
        const { executor, query } = mockExecutor();

        await expect(grantSelectToReader(executor, "agg_x", "")).resolves.toBeNull();
        expect(query).not.toHaveBeenCalled();
    });
});
