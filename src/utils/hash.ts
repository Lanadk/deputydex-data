// utils/hash.ts
import { createHash } from 'crypto';

export function computeRowHash(obj: Record<string, any>): string {
    // On exclut row_hash lui-même si présent, et on trie les clés pour stabilité
    const { row_hash, ...rest } = obj;
    return createHash('md5')
        .update(JSON.stringify(rest, Object.keys(rest).sort()))
        .digest('hex');
}

