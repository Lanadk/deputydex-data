export interface DownloadItem {
    id: number;
    sourceId: number;
    legislature: number;
    domain: string;
    url: string;
    fileName: string;
    checksum?: string;
    fileSize?: bigint;
    lastDownloadAt?: Date;
}

export interface DownloadPaths {
    zipDir: string;              // data/download/zip/2025-02-09_14-30-45
    zipFilePath: string;         // data/download/zip/2025-02-09_14-30-45/file.zip
    unzipDir: string;            // data/download/unzip/acteurs
}

export interface DownloadResult {
    success: boolean;
    item: DownloadItem;
    path?: string;
    checksum?: string;
    fileSize?: bigint;
    skipped?: boolean;
    reason?: string;
    error?: Error;
}

export interface ProcessOptions {
    force: boolean;
    maxRetries: number;
}

export interface UseCaseOptions {
    force?: boolean;
    maxRetries?: number;
    parallel?: boolean;
    maxConcurrency?: number;
}

export interface Filters {
    legislature?: number;
    domain?: string;
    sourceIds?: number[];
}

export interface JobOptions {
    force?: boolean;
    maxRetries?: number;
    parallel?: boolean;
    maxConcurrency?: number;
    filters?: Filters;
}

