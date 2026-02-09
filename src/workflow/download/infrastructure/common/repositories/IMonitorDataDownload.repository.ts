export interface DownloadStatusData {
    fileName: string;
    downloaded: boolean;
    checksum?: string;
    fileSize?: bigint;
    errorMessage?: string | null;
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

export interface IMonitorDataDownloadRepository {
    upsertDownloadStatus(sourceId: number, data: DownloadStatusData): Promise<DownloadMonitor>;
    findBySourceId(sourceId: number): Promise<DownloadMonitor | null>;
    findMany(filters?: { downloaded?: boolean }): Promise<DownloadMonitorWithSource[]>;
    markAsDownloaded(fileName: string, sourceId: number, checksum: string, fileSize: bigint): Promise<DownloadMonitor>;
    markAsFailed(fileName: string, sourceId: number, errorMessage: string): Promise<DownloadMonitor>;
    resetDownloadStatus(sourceId: number): Promise<DownloadMonitor>;
}