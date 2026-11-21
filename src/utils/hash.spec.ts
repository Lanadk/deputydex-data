import { computeRowHash } from './hash';

describe('computeRowHash', () => {
    it('produces a stable md5 hex digest regardless of key order', () => {
        const a = computeRowHash({ b: 2, a: 1 });
        const b = computeRowHash({ a: 1, b: 2 });

        expect(a).toBe(b);
        expect(a).toMatch(/^[0-9a-f]{32}$/);
    });

    it('excludes an existing row_hash field from the computed hash', () => {
        const withoutHash = computeRowHash({ a: 1, b: 2 });
        const withStaleHash = computeRowHash({ a: 1, b: 2, row_hash: 'stale-value' });

        expect(withStaleHash).toBe(withoutHash);
    });

    it('produces different hashes for different content', () => {
        const a = computeRowHash({ a: 1 });
        const b = computeRowHash({ a: 2 });

        expect(a).not.toBe(b);
    });

    it('keeps the exact digests already stored in the DB (key order: UTF-16, not locale)', () => {
        // Majuscules, `_` et chiffres : un tri localeCompare changerait l'ordre des
        // clés, donc toutes les empreintes déjà en base.
        const digest = computeRowHash({ uid: 'PA1', Nom: 'Dupont', _meta: 1, nom_usage: 'x', a10: 2, a2: 3, row_hash: 'stale' });

        expect(digest).toBe('31e67b5abb05b8c3c29bb2f80fffcab7');
    });

    it('does not mutate the input object', () => {
        const input = { a: 1, row_hash: 'stale' };
        computeRowHash(input);

        expect(input).toEqual({ a: 1, row_hash: 'stale' });
    });
});
