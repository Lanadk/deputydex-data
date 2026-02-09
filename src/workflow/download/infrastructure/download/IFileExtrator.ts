export interface IFileExtractor {
    extract(zipPath: string, targetDir: string): Promise<void>;
}