import fs from 'fs';
import path from 'path';
import { DirectorySource } from './DirectorySource';
import {IDirectorySource} from "../IDirectorySource";

export class MultiDirectorySource implements IDirectorySource {
    constructor(
        private baseDir: string,
        private subdirs: string[]
    ) {}

    getFiles(): string[] {
        let allFiles: string[] = [];

        for (const subdir of this.subdirs) {
            const fullPath = path.join(this.baseDir, subdir);

            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
                const source = new DirectorySource(fullPath);
                const files = source.getFiles();
                allFiles = allFiles.concat(files);
            }
        }

        return allFiles;
    }
}