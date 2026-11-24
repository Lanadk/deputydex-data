// xml-nil.utils.ts

/**
 * Normalise les valeurs nilables du format XML/JSON de l'Assemblée Nationale.
 * Les champs vides sont représentés comme :
 * { "@xsi:nil": "true", "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance" }
 * au lieu de null.
 */
export function extractNilableValue(val: any): string | null {
    if (val == null) return null;
    if (typeof val === 'object' && val['@xsi:nil'] === 'true') return null;
    return val['#text'] ?? (typeof val === 'string' ? val : null);
}

/** Booléen sérialisé en texte (« true » / « false »), ou null si absent, nil ou autre. */
export function toBoolOrNull(val: any): boolean | null {
    const raw = typeof val === 'boolean' ? String(val) : extractNilableValue(val);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return null;
}

/** Entier, ou null si la valeur est absente, nil ou non numérique. */
export function toIntOrNull(val: any): number | null {
    const raw = extractNilableValue(val);
    if (raw == null) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
}

/** Date avec fuseau (« 2024-10-01+02:00 ») → date seule (« 2024-10-01 »), ou null. */
export function toDateOrNull(val: any): string | null {
    const raw = extractNilableValue(val);
    return raw ? raw.slice(0, 10) : null;
}
