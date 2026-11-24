import fs from 'fs';
import path from 'path';
import {IDirectorySource} from "../IDirectorySource";

export class DirectorySource implements IDirectorySource {
    /** @param extension extension des fichiers à lister (`.json` par défaut ; `.xml` pour les débats). */
    constructor(private dir: string, private extension: string = '.json') {}

    getFiles(): string[] {
        const files: string[] = [];

        const traverse = (currentDir: string) => {
            const items = fs.readdirSync(currentDir);
            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stats = fs.statSync(fullPath);

                if (stats.isDirectory()) {
                    traverse(fullPath);
                } else if (stats.isFile() && item.endsWith(this.extension)) {
                    files.push(fullPath);
                }
            }
        };

        traverse(this.dir);
        return files;
    }
}