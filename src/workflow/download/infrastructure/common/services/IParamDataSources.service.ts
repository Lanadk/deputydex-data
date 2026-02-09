import {DownloadItem} from "../../../types/types";

export interface DataSourceFilters {
    legislature?: number;
    domain?: string;
    sourceIds?: number[];
}

export interface DataSourceWithRelations {
    id: number;
    domainId: number;
    legislatureId: number;
    downloadUrl: string;
    fileName: string;
    createdAt: Date;
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
        createdAt: Date;
        updatedAt: Date;
    };
    downloads: Array<{
        id: number;
        sourceId: number;
        fileName: string | null;
        downloaded: boolean;
        lastDownloadAt: Date | null;
        checksum: string | null;
        fileSize: bigint | null;
        errorMessage: string | null;
        updatedAt: Date;
    }>;
}

export interface IParamDataSourceService {
    getDownloadItems(filters?: DataSourceFilters): Promise<DownloadItem[]>;
    getSourceById(sourceId: number): Promise<DataSourceWithRelations | null>;
    getSourcesByLegislature(legislature: number): Promise<DataSourceWithRelations[]>;
    getSourcesByDomain(domainCode: string): Promise<DataSourceWithRelations[]>;
    getSourcesCount(filters?: DataSourceFilters): Promise<number>;
}