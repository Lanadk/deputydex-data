export interface IFileDownloader {
    downloadWithRetry(url: string, dest: string, maxRetries: number): Promise<void>;
}