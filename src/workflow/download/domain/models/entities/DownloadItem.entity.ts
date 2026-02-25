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
    subdomains?: string[];
}
