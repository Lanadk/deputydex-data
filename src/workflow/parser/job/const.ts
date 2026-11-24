/** Data dir constants **/
export const baseInData = '../../../../../../data/download/unzip';
export const baseOutData = '../../../../../../data/parser/';
export const outTableDirectoryName = 'tables';

/** Periodic flush: write parsed tables to disk and clear them from memory
 * every N files, instead of accumulating the whole domain (e.g. ~140k
 * amendements files) in RAM before writing anything (see BatchProcessor). **/
export const parseFlushEveryFiles = 10_000;

/** Domains const **/
export const scrutinsSourceDirectoryName = 'scrutins';
export const acteursSourceDirectoryName = 'acteurs/json/acteur';
/** Même archive AMO que les acteurs : commissions, groupes, ministères, gouvernements… */
export const organesSourceDirectoryName = 'acteurs/json/organe';
export const amendementsSourceDirectoryName = 'amendements';
export const dossiersSourceDirectoryName = 'dossiers_legislatifs/json/dossierParlementaire';
export const documentsSourceDirectoryName = 'dossiers_legislatifs/json/document';
/** Jeu « Réunions » (agenda) : commissions, séances publiques, groupes d'études… */
export const reunionsSourceDirectoryName = 'reunions/json/reunion';
/**
 * Trois archives (une par type de question, même format), donc trois domaines
 * de téléchargement, parsés ensemble dans le domaine « questions ».
 */
export const questionsSourceDirectoryNames = [
    'questions_gouvernement/json',
    'questions_orales_sans_debat/json',
    'questions_ecrites/json',
];
