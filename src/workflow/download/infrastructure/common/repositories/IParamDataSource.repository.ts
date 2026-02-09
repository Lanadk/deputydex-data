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

export interface IParamDataSourceRepository {
    findManyWithRelations(filters?: DataSourceFilters): Promise<DataSourceWithRelations[]>;
    findById(id: number): Promise<DataSourceWithRelations | null>;
    findByLegislature(legislatureId: number): Promise<DataSourceWithRelations[]>;
    findByDomain(domainCode: string): Promise<DataSourceWithRelations[]>;
}