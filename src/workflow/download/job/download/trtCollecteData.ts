import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

const rootDir = resolve(__dirname, '../../../../..');
const envPath = resolve(rootDir, '.env.local');

//console.log('🔍 Root dir:', rootDir);
//console.log('🔍 Env path:', envPath);
//console.log('🔍 Env exists?', existsSync(envPath) ? '✅ Oui' : '❌ Non');

config({ path: envPath });

import { DownloadJob } from './DownloadJob';
import {Logger, LogLevel} from "../../../../utils/logger";

import {FileDownloader} from "../../infrastructure/download/impl/FileDownloader";
import {FileExtractor} from "../../infrastructure/download/impl/FileExtractor";
import {FileVerifier} from "../../infrastructure/download/impl/FileVerifier";
import {FileManager} from "../../infrastructure/download/impl/FileManager";
import {ParamDataSourceService} from "../../infrastructure/common/services/imp/ParamDataSource.service";
import {MonitorDataDownloadService} from "../../infrastructure/common/services/imp/MonitorDataDownload.service";
import {DownloadItemProcessor} from "../../models/domain/download/DownloadItemProcessor";
import {DownloadFilesUseCase} from "../../models/usecases/download/DownloadFilesUseCase";


async function main() {
    const logger = new Logger(LogLevel.INFO);
    console.log('DB_URL:', process.env.DB_URL ? '✅ Définie' : '❌ Non définie');
    try {
        const fileDownloader = new FileDownloader(logger);
        const fileExtractor = new FileExtractor(logger);
        const fileVerifier = new FileVerifier();
        const fileManager = new FileManager();

        const processor = new DownloadItemProcessor(
            fileDownloader,
            fileExtractor,
            fileVerifier,
            fileManager,
            logger
        );

        const paramDataSourceService = new ParamDataSourceService();
        const monitorDataDownloadService = new MonitorDataDownloadService();

        const downloadUseCase = new DownloadFilesUseCase(
            paramDataSourceService,
            monitorDataDownloadService,
            processor,
            fileManager,
            logger
        );

        const job = new DownloadJob(downloadUseCase, logger);

        await job.run({
            force: false,
            maxRetries: 3,
            parallel: false,
            filters: undefined
        });

    } catch (error) {
        logger.error('Job failed:', error);
        process.exit(1);
    }
}

export { main };

if (require.main === module) {
    main().catch(console.error);
}