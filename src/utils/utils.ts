import fs from "fs";

/**
 * Formate un tableau JSON pour un import PostgreSQL safe
 * - Chaque objet sur une ligne (NDJSON)
 * - UTF-8 encodé
 * - Caractères spéciaux échappés
 */
export function formatJsonForImport(data: any[], outputFile: string): void {
    const stream = fs.createWriteStream(outputFile, { encoding: 'utf-8' });

    for (const obj of data) {
        // JSON.stringify encode automatiquement les quotes et les \n
        stream.write(JSON.stringify(obj) + '\n');
    }

    stream.end();
    // console.log(`[DEBUG  🔍]: Formatted ${data.length} records for import: ${outputFile}`);
}