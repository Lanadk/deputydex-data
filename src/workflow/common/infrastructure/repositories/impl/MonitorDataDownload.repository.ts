import {
    DownloadMonitor,
    DownloadMonitorWithSource,
    DownloadStatusData,
    IMonitorDataDownloadRepository
} from "../IMonitorDataDownload.repository";
import {prisma} from "../../../../../../prisma/prisma";


export class MonitorDataDownloadRepository implements IMonitorDataDownloadRepository {
    async upsertDownloadStatus(sourceId: number, data: DownloadStatusData): Promise<DownloadMonitor> {
        return prisma.monitorDataDownload.upsert({
            where: { sourceId },
            create: {
                fileName: data.fileName,
                sourceId,
                downloaded: data.downloaded,
                lastDownloadAt: new Date(),
                checksum: data.checksum,
                fileSize: data.fileSize,
                errorMessage: data.errorMessage || null
            },
            update: {
                fileName: data.fileName,
                downloaded: data.downloaded,
                lastDownloadAt: new Date(),
                checksum: data.checksum,
                fileSize: data.fileSize,
                errorMessage: data.errorMessage || null,
                updatedAt: new Date()
            }
        });
    }

    async findBySourceId(sourceId: number): Promise<DownloadMonitor | null> {
        return prisma.monitorDataDownload.findUnique({
            where: { sourceId }
        });
    }

    async findMany(filters?: { downloaded?: boolean }): Promise<DownloadMonitorWithSource[]> {
        return prisma.monitorDataDownload.findMany({
            where: {
                ...(filters?.downloaded !== undefined && { downloaded: filters.downloaded })
            },
            include: {
                source: {
                    include: {
                        domain: true,
                        legislature: true
                    }
                }
            }
        });
    }

    async markAsDownloaded(fileName: string, sourceId: number, checksum: string, fileSize: bigint): Promise<DownloadMonitor> {
        return this.upsertDownloadStatus(sourceId, {
            fileName,
            downloaded: true,
            checksum,
            fileSize,
            errorMessage: null
        });
    }

    async markAsFailed(fileName: string, sourceId: number, errorMessage: string): Promise<DownloadMonitor> {
        return this.upsertDownloadStatus(sourceId, {
            fileName,
            downloaded: false,
            errorMessage
        });
    }

    async resetDownloadStatus(sourceId: number): Promise<DownloadMonitor> {
        return prisma.monitorDataDownload.update({
            where: { sourceId },
            data: {
                downloaded: false,
                lastDownloadAt: null,
                checksum: null,
                fileSize: null,
                errorMessage: null,
                updatedAt: new Date()
            }
        });
    }
}