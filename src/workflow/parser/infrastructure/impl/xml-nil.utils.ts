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