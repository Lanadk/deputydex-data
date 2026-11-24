import fs from 'fs';
import https from 'https';
import {IFileDownloader} from "../IFileDownloader";
import {Logger} from "../../../../utils/logger";

export interface DownloadProgress {
    totalBytes: number;
    downloadedBytes: number;
    percentage: number;
}

/** Attente maximale entre deux tentatives (backoff exponentiel 1 s, 2 s, 4 s… plafonné). */
const MAX_RETRY_DELAY_MS = 30_000;

/**
 * Connexion sans aucun octet reçu pendant ce délai : abandonnée puis retentée,
 * au lieu de rester pendue indéfiniment.
 */
const IDLE_TIMEOUT_MS = 60_000;

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
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), MAX_RETRY_DELAY_MS);
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

            let settled = false;
            let totalBytes = 0;
            let downloadedBytes = 0;

            const cleanupPartialFile = () => {
                try {
                    if (fs.existsSync(dest)) fs.unlinkSync(dest);
                } catch {
                    // best effort: don't let cleanup itself mask the real error
                }
            };

            const fail = (err: Error) => {
                if (settled) return;
                settled = true;
                file.destroy();
                cleanupPartialFile();
                reject(err);
            };

            const succeed = () => {
                if (settled) return;
                settled = true;
                this.logger.success(`Downloaded: ${dest} (${downloadedBytes} bytes)`);
                resolve();
            };

            const request = https.get(url, { timeout: IDLE_TIMEOUT_MS }, (response) => {
                if (response.statusCode !== 200) {
                    response.resume();
                    fail(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                totalBytes = Number.parseInt(response.headers['content-length'] || '0', 10);

                const truncated = () =>
                    response.complete === false || (totalBytes > 0 && downloadedBytes !== totalBytes);

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

                response.on('error', (err) => fail(err));

                // 'close' se déclenche dès que la connexion sous-jacente se ferme,
                // que le transfert se soit terminé proprement ou non (contrairement à
                // 'error'/'end' qui ne se déclenchent pas forcément sur une coupure
                // brutale). C'est ce qui permet de détecter un flux tronqué quand
                // 'finish' côté writable ne surviendra jamais (response.pipe(file)
                // n'appelle file.end() que si response émet 'end').
                response.on('close', () => {
                    if (settled) return;
                    if (truncated()) {
                        fail(new Error(`Truncated download (${downloadedBytes}/${totalBytes || '?'} bytes): ${url}`));
                    }
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close(() => {
                        if (settled) return;
                        if (truncated()) {
                            fail(new Error(`Truncated download (${downloadedBytes}/${totalBytes || '?'} bytes): ${url}`));
                            return;
                        }
                        succeed();
                    });
                });

                file.on('error', (err) => fail(err));
            });

            request.on('error', (err) => fail(err));
            // 'timeout' ne coupe rien de lui-même : on détruit la requête, ce qui
            // déclenche 'error' (et donc fail) avec un message explicite.
            request.on('timeout', () => {
                request.destroy(new Error(`No data received for ${IDLE_TIMEOUT_MS / 1000}s: ${url}`));
            });
        });
    }
}