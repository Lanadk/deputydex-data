import {FileDownloader} from "../infrastructure/impl/FileDownloader";
import {Logger, LogLevel} from "../../../utils/logger";
import {FileExtractor} from "../infrastructure/impl/FileExtractor";
import {FileVerifier} from "../infrastructure/impl/FileVerifier";
import {FileManager} from "../infrastructure/impl/FileManager";
import {DownloadItemProcessor} from "../domain/models/DownloadItemProcessor";
import {ParamDataSourceService} from "../../_common/infrastructure/services/imp/ParamDataSource.service";
import {MonitorDataDownloadService} from "../../_common/infrastructure/services/imp/MonitorDataDownload.service";
import {DownloadFilesUsecase} from "../domain/usecases/DownloadFiles.usecase";
import {DownloadJob} from "./DownloadJob";
import {
    ParamCurrentLegislatureService
} from "../../_common/infrastructure/services/imp/ParamCurrentLegislature.service";

async function main() {
    const logger = new Logger(LogLevel.DEBUG);
    console.log('DB_URL:', process.env.DB_URL ? '✅ Définie' : '❌ Non définie');
    try {
        const fileDownloader = new FileDownloader(logger);
        const fileExtractor = new FileExtractor(logger);
        const fileVerifier = new FileVerifier();
        const fileManager = new FileManager();

        const paramDataSourceService = new ParamDataSourceService();
        const monitorDataDownloadService = new MonitorDataDownloadService();
        const currentLegislatureService = new ParamCurrentLegislatureService();


        const processor = new DownloadItemProcessor(
            fileDownloader,
            fileExtractor,
            fileVerifier,
            fileManager,
            currentLegislatureService,
            monitorDataDownloadService,
            logger
        );

        const downloadUseCase = new DownloadFilesUsecase(
            paramDataSourceService,
            monitorDataDownloadService,
            currentLegislatureService,
            processor,
            fileManager,
            logger
        );

        const job = new DownloadJob(downloadUseCase, logger);

        await job.run({
            force: false,
            maxRetries: 3,
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