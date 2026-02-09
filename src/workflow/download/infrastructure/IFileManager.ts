export interface DownloadPaths {
    zipDir: string;
    zipFilePath: string;
    unzipDir: string;
}

export interface IFileManager {
    prepareDownloadPaths(
        timestampedZipDir: string,
        filename: string,
        domain: string
    ): DownloadPaths;

    fileExists(filepath: string): Promise<boolean>;
    createTimestampedZipDir(): string;
}