import fs from "fs";

/**
 * Formate un tableau JSON pour un import PostgreSQL safe
 * - Chaque objet sur une ligne (NDJSON)
 * - UTF-8 encodé
 * - Caractères spéciaux échappés
 */
export function formatJsonForImport(data: any[], outputFile: string, options: { append?: boolean } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(outputFile, { encoding: 'utf-8', flags: options.append ? 'a' : 'w' });

        stream.on('finish', resolve);
        stream.on('error', reject);

        for (const obj of data) {
            // JSON.stringify encode automatiquement les quotes et les \n
            stream.write(JSON.stringify(obj) + '\n');
        }

        stream.end();
    });
}