import {DataSourceFilters, DataSourceWithRelations, IParamDataSourceService} from "../IParamDataSources.service";
import {IParamDataSourceRepository} from "../../repositories/IParamDataSource.repository";
import {ParamDataSourceRepository} from "../../repositories/impl/ParamDataSource.repository";
import {DownloadItem} from "../../../../download/domain/models/entities/DownloadItem.entity";

export class ParamDataSourceService implements IParamDataSourceService {
    private repository: IParamDataSourceRepository;

    constructor(repository?: IParamDataSourceRepository) {
        this.repository = repository || new ParamDataSourceRepository();
    }

    async getDownloadItems(filters?: DataSourceFilters): Promise<DownloadItem[]> {
        const sources = await this.repository.findManyWithRelations(filters);

        return sources.map(source => ({
            id: source.downloads[0]?.id || 0,
            fileName: source.fileName,
            sourceId: source.id,
            legislature: source.legislature.number,
            domain: source.domain.code,
            url: source.downloadUrl,
            filename: source.fileName,
            checksum: source.downloads[0]?.checksum || undefined,
            fileSize: source.downloads[0]?.fileSize || undefined,
            lastDownloadAt: source.downloads[0]?.lastDownloadAt || undefined
        }));
    }

    async getSourceById(sourceId: number): Promise<DataSourceWithRelations | null> {
        return this.repository.findById(sourceId);
    }

    async getSourcesByLegislature(legislature: number): Promise<DataSourceWithRelations[]> {
        return this.repository.findByLegislature(legislature);
    }

    async getSourcesByDomain(domainCode: string): Promise<DataSourceWithRelations[]> {
        return this.repository.findByDomain(domainCode);
    }

    async getSourcesCount(filters?: DataSourceFilters): Promise<number> {
        const sources = await this.repository.findManyWithRelations(filters);
        return sources.length;
    }
}