import {DataSourceFilters, DataSourceWithRelations, IParamDataSourceRepository} from "../IParamDataSource.repository";
import {prisma} from "../../../../../../../prisma/prisma";

export class ParamDataSourceRepository implements IParamDataSourceRepository {
    async findManyWithRelations(filters?: DataSourceFilters): Promise<DataSourceWithRelations[]> {
        return prisma.paramDataSource.findMany({
            where: {
                ...(filters?.legislature && { legislatureId: filters.legislature }),
                ...(filters?.sourceIds && { id: { in: filters.sourceIds } }),
                domain: {
                    ...(filters?.domain && { code: filters.domain })
                }
            },
            include: {
                domain: true,
                legislature: true,
                downloads: true
            }
        });
    }

    async findById(id: number): Promise<DataSourceWithRelations | null> {
        return prisma.paramDataSource.findUnique({
            where: { id },
            include: {
                domain: true,
                legislature: true,
                downloads: true
            }
        });
    }

    async findByLegislature(legislatureId: number): Promise<DataSourceWithRelations[]> {
        return prisma.paramDataSource.findMany({
            where: { legislatureId },
            include: {
                domain: true,
                legislature: true,
                downloads: true
            }
        });
    }

    async findByDomain(domainCode: string): Promise<DataSourceWithRelations[]> {
        return prisma.paramDataSource.findMany({
            where: {
                domain: { code: domainCode }
            },
            include: {
                domain: true,
                legislature: true,
                downloads: true
            }
        });
    }
}