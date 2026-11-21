// utils/hash.ts
import { createHash } from 'crypto';

export function computeRowHash(obj: Record<string, any>): string {
    // On exclut row_hash lui-même si présent, et on trie les clés pour stabilité
    const { row_hash, ...rest } = obj;
    // MD5 : empreinte de détection de changement d'une ligne, pas de sécurité.
    // Tri par code UTF-16 (ordre par défaut de sort, rendu explicite) : un autre
    // ordre de clés changerait toutes les empreintes déjà en base.
    return createHash('md5')
        .update(JSON.stringify(rest, Object.keys(rest).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))))
        .digest('hex');
}

