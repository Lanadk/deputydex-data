export interface DownloadStatusUpdate {
    fileName: string;
    downloaded: boolean;
    checksum?: string;
    fileSize?: bigint;
    errorMessage?: string;
}

export interface DownloadStats {
    total: number;
    downloaded: number;
    failed: number;
    pending: number;
    successRate: number;
}

export interface DownloadMonitor {
    id: number;
    sourceId: number;
    fileName: string | null;
    downloaded: boolean;
    lastDownloadAt: Date | null;
    checksum: string | null;
    fileSize: bigint | null;
    errorMessage: string | null;
    updatedAt: Date;
}

export interface DownloadMonitorWithSource extends DownloadMonitor {
    source: {
        id: number;
        domainId: number;
        legislatureId: number;
        downloadUrl: string;
        fileName: string;
        domain: {
            id: number;
            code: string;
            description: string | null;
        };
        legislature: {
            id: number;
            number: number;
            startDate: Date | null;
            endDate: Date | null;
        };
    };
}

export interface IMonitorDataDownloadService {
    updateDownloadStatus(fileName: string, sourceId: number, data: DownloadStatusUpdate): Promise<void>;
    markAsDownloaded(fileName: string, sourceId: number, checksum: string, fileSize: bigint): Promise<void>;
    markAsFailed(fileName: string, sourceId: number, errorMessage: string): Promise<void>;
    resetDownload(sourceId: number): Promise<void>;
    getDownloadStatus(sourceId: number): Promise<DownloadMonitor | null>;
    getAllDownloadedSources(): Promise<DownloadMonitorWithSource[]>;
    getAllFailedSources(): Promise<DownloadMonitorWithSource[]>;
    getDownloadStats(): Promise<DownloadStats>;
}