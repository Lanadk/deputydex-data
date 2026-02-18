export interface DownloadItem { // TODO ceci est une entity
    id: number;
    sourceId: number;
    legislature: number;
    domain: string;
    url: string;
    fileName: string;
    checksum?: string;
    fileSize?: bigint;
    lastDownloadAt?: Date;
    subdomains?: string[];
}

export interface DownloadPaths {
    zipDir: string;
    zipFilePath: string;
    unzipDir: string;
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
    maxConcurrency?: number;
    filters?: Filters;
}

