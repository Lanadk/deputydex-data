import {DownloadItem} from "../domain/models/entities/DownloadItem.entity";

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

export interface DownloadPaths {
    zipDir: string;
    zipFilePath: string;
    unzipDir: string;
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

