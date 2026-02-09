import {
    DownloadMonitor,
    DownloadMonitorWithSource, DownloadStats,
    DownloadStatusUpdate,
    IMonitorDataDownloadService
} from "../IMonitorDataDownload.service";
import {IMonitorDataDownloadRepository} from "../../repositories/IMonitorDataDownload.repository";
import {MonitorDataDownloadRepository} from "../../repositories/impl/MonitorDataDownload.repository";

export class MonitorDataDownloadService implements IMonitorDataDownloadService {
    private repository: IMonitorDataDownloadRepository;

    constructor(repository?: IMonitorDataDownloadRepository) {
        this.repository = repository || new MonitorDataDownloadRepository();
    }

    async updateDownloadStatus(
        fileName: string,
        sourceId: number,
        data: DownloadStatusUpdate
    ): Promise<void> {
        await this.repository.upsertDownloadStatus(sourceId, {
            fileName: data.fileName,
            downloaded: data.downloaded,
            checksum: data.checksum,
            fileSize: data.fileSize,
            errorMessage: data.errorMessage || null
        });
    }

    async markAsDownloaded(
        fileName: string,
        sourceId: number,
        checksum: string,
        fileSize: bigint
    ): Promise<void> {
        await this.repository.markAsDownloaded(fileName, sourceId, checksum, fileSize);
    }

    async markAsFailed(
        fileName: string,
        sourceId: number,
        errorMessage: string
    ): Promise<void> {
        await this.repository.markAsFailed(fileName, sourceId, errorMessage);
    }

    async resetDownload(sourceId: number): Promise<void> {
        await this.repository.resetDownloadStatus(sourceId);
    }

    async getDownloadStatus(sourceId: number): Promise<DownloadMonitor | null> {
        return this.repository.findBySourceId(sourceId);
    }

    async getAllDownloadedSources(): Promise<DownloadMonitorWithSource[]> {
        return this.repository.findMany({ downloaded: true });
    }

    async getAllFailedSources(): Promise<DownloadMonitorWithSource[]> {
        return this.repository.findMany({ downloaded: false });
    }

    async getDownloadStats(): Promise<DownloadStats> {
        const all = await this.repository.findMany();
        const downloaded = all.filter(d => d.downloaded).length;
        const failed = all.filter(d => !d.downloaded && d.errorMessage).length;
        const pending = all.filter(d => !d.downloaded && !d.errorMessage).length;

        return {
            total: all.length,
            downloaded,
            failed,
            pending,
            successRate: all.length > 0 ? (downloaded / all.length) * 100 : 0
        };
    }
}