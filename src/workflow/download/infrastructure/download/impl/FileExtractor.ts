import {IFileExtractor} from "../IFileExtrator";
import {Logger} from "../../../../../utils/logger";
import {unzipFile} from "../../../../../utils/unzip";

export class FileExtractor implements IFileExtractor {
    constructor(private logger: Logger) {}

    async extract(zipPath: string, targetDir: string): Promise<void> {
        this.logger.info(`Unzipping: ${zipPath}`);
        await unzipFile(zipPath, targetDir);
        this.logger.success(`Unzipped to: ${targetDir}`);
    }
}