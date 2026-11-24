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
/** Jeu « Débats » (comptes rendus de séance Syceron), XML uniquement. */
export const debatsSourceDirectoryName = 'debats/xml/compteRendu';
/**
 * Un compte rendu XML pèse jusqu'à ~1,2 Mo et produit des centaines de lignes
 * avec leur texte intégral : vider la mémoire bien plus souvent que
 * `parseFlushEveryFiles` (la législature 17 entière tiendrait ~1,3 Go).
 */
export const debatsFlushEveryFiles = 100;
export const questionsSourceDirectoryNames = [
    'questions_gouvernement/json',
    'questions_orales_sans_debat/json',
    'questions_ecrites/json',
];
