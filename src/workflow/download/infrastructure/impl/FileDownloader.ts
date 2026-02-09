import fs from 'fs';
import https from 'https';
import {IFileDownloader} from "../IFileDownloader";
import {Logger} from "../../../../utils/logger";

export interface DownloadProgress {
    totalBytes: number;
    downloadedBytes: number;
    percentage: number;
}

export class FileDownloader implements IFileDownloader {
    constructor(private logger: Logger) {}

    async downloadWithRetry(
        url: string,
        dest: string,
        maxRetries: number = 3
    ): Promise<void> {
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.logger.info(`Attempt ${attempt}/${maxRetries}: ${url}`);
                await this.download(url, dest);
                return;
            } catch (error) {
                lastError = error as Error;
                this.logger.warn(`Attempt ${attempt} failed: ${lastError.message}`);

                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    this.logger.info(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
    }

    async download(
        url: string,
        dest: string,
        onProgress?: (progress: DownloadProgress) => void
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const file = fs.createWriteStream(dest);

            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
                let downloadedBytes = 0;

                response.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    if (onProgress && totalBytes > 0) {
                        onProgress({
                            totalBytes,
                            downloadedBytes,
                            percentage: (downloadedBytes / totalBytes) * 100
                        });
                    }
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    this.logger.success(`Downloaded: ${dest}`);
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlinkSync(dest);
                reject(err);
            });
        });
    }
}