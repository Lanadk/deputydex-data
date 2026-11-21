import { revalidateFrontCache } from "./revalidateFrontCache";

const URL = "http://front.test/api/revalidate";
const SECRET = "s3cr3t";

const fakeFetch = (impl: () => Promise<Partial<Response>>) =>
    jest.fn(impl) as unknown as jest.MockedFunction<typeof fetch>;

describe("revalidateFrontCache", () => {
    it("demande au front de vider son cache", async () => {
        const fetchFn = fakeFetch(async () => ({ ok: true, status: 200 }));

        const outcome = await revalidateFrontCache({ url: URL, secret: SECRET, fetchFn });

        expect(outcome).toEqual({ status: "done", httpStatus: 200 });
        expect(fetchFn).toHaveBeenCalledWith(URL, expect.objectContaining({
            method: "POST",
            headers: { Authorization: `Bearer ${SECRET}` },
        }));
    });

    it("ignore l'étape sans configuration (poste local), sans appeler le front", async () => {
        const fetchFn = fakeFetch(async () => ({ ok: true, status: 200 }));

        expect((await revalidateFrontCache({ url: undefined, secret: SECRET, fetchFn })).status).toBe("skipped");
        expect((await revalidateFrontCache({ url: URL, secret: "", fetchFn })).status).toBe("skipped");
        expect(fetchFn).not.toHaveBeenCalled();
    });

    it("échoue si le front refuse", async () => {
        const fetchFn = fakeFetch(async () => ({ ok: false, status: 401 }));

        expect(await revalidateFrontCache({ url: URL, secret: SECRET, fetchFn })).toEqual({
            status: "failed",
            reason: "le front a répondu 401",
        });
    });

    it("échoue si le front ne répond pas", async () => {
        const fetchFn = fakeFetch(async () => { throw new Error("connect ECONNREFUSED"); });

        expect(await revalidateFrontCache({ url: URL, secret: SECRET, fetchFn })).toEqual({
            status: "failed",
            reason: "connect ECONNREFUSED",
        });
    });
});
