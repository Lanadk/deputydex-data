export interface IFileManager {
    prepareDownloadPaths(
        timestampedZipDir: string,
        filename: string,
        domain: string
    ): { zipDir: string; zipFilePath: string; unzipDir: string };

    fileExists(filepath: string): Promise<boolean>;
    createTimestampedZipDir(): string;
}