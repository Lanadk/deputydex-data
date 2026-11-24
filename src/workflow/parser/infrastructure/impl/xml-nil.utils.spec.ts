import { extractNilableValue, toBoolOrNull, toDateOrNull, toIntOrNull } from './xml-nil.utils';

const NIL = { '@xsi:nil': 'true', '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance' };

describe('toBoolOrNull', () => {
    it('convertit « true » / « false » (texte ou booléen)', () => {
        expect(toBoolOrNull('true')).toBe(true);
        expect(toBoolOrNull('false')).toBe(false);
        expect(toBoolOrNull(true)).toBe(true);
        expect(toBoolOrNull(false)).toBe(false);
    });

    it('renvoie null pour une valeur absente, nil ou autre', () => {
        expect(toBoolOrNull(undefined)).toBeNull();
        expect(toBoolOrNull(NIL)).toBeNull();
        expect(toBoolOrNull('oui')).toBeNull();
    });
});

describe('toIntOrNull', () => {
    it('convertit un entier texte', () => {
        expect(toIntOrNull('5')).toBe(5);
    });

    it('renvoie null pour une valeur absente, nil ou non numérique', () => {
        expect(toIntOrNull(null)).toBeNull();
        expect(toIntOrNull(NIL)).toBeNull();
        expect(toIntOrNull('abc')).toBeNull();
    });
});

describe('toDateOrNull', () => {
    it('retire le fuseau d\'une date', () => {
        expect(toDateOrNull('2024-10-01+02:00')).toBe('2024-10-01');
    });

    it('renvoie null pour une valeur absente ou nil', () => {
        expect(toDateOrNull(undefined)).toBeNull();
        expect(toDateOrNull(NIL)).toBeNull();
    });
});

describe('extractNilableValue', () => {
    it('returns null for null/undefined input', () => {
        expect(extractNilableValue(null)).toBeNull();
        expect(extractNilableValue(undefined)).toBeNull();
    });

    it('returns null for the AN xsi:nil marker object', () => {
        expect(
            extractNilableValue({
                '@xsi:nil': 'true',
                '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            })
        ).toBeNull();
    });

    it('returns the plain string when given a raw string', () => {
        expect(extractNilableValue('hello')).toBe('hello');
    });

    it('extracts the #text field from a wrapped value object', () => {
        expect(extractNilableValue({ '#text': 'wrapped value' })).toBe('wrapped value');
    });

    it('returns null when the object has neither #text nor xsi:nil', () => {
        expect(extractNilableValue({ '@xsi:type': 'Something' })).toBeNull();
    });
});
