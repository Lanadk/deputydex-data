import {FileDownloader} from "../infrastructure/impl/FileDownloader";
import {Logger, LogLevel} from "../../../utils/logger";
import {FileExtractor} from "../infrastructure/impl/FileExtractor";
import {FileVerifier} from "../infrastructure/impl/FileVerifier";
import {FileManager} from "../infrastructure/impl/FileManager";
import {DownloadItemProcessor} from "../domain/models/DownloadItemProcessor";
import {ParamDataSourceService} from "../../common/infrastructure/services/imp/ParamDataSource.service";
import {MonitorDataDownloadService} from "../../common/infrastructure/services/imp/MonitorDataDownload.service";
import {DownloadFilesUseCase} from "../domain/usecases/DownloadFilesUseCase";
import {DownloadJob} from "./DownloadJob";

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