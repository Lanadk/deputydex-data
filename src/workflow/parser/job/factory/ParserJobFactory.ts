import {IExtractor} from "../../infrastructure/IExtractor";
import {Logger, LogLevel} from "../../../../utils/logger";
import {ActeursExtractor} from "../../domain/models/ActeursExtractor";
import {ScrutinsExtractor} from "../../domain/models/ScrutinsExtractor";
import {
    acteursSourceDirectoryName,
    baseInData,
    baseOutData, mandatsSourceDirectoryName,
    outTableDirectoryName,
    scrutinsSourceDirectoryName
} from "../const";
import {ParserJob} from "../parser/ParserJob";
import path from "path";
import {DirectorySource} from "../../infrastructure/impl/DirectorySource";
import {JsonFileWriter} from "../../infrastructure/impl/JsonFileWriter";
import {BatchProcessor} from "../../domain/models/BatchProcessor";
import {ParseFilesUseCase} from "../../domain/usecases/ParseFilesUseCase";
import {MandatsExtractor} from "../../domain/models/MandatExtractor";

export type ParserDomain = 'acteurs' | 'scrutins' | 'mandats';

export interface ParserJobRunnerConfig {
    domain: ParserDomain;
    logLevel?: LogLevel;
}

export class ParserJobFactory {
    private static readonly EXTRACTORS: Record<ParserDomain, new () => IExtractor> = {
        acteurs: ActeursExtractor,
        scrutins: ScrutinsExtractor,
        mandats: MandatsExtractor
    };

    private static readonly SOURCE_DIRS: Record<ParserDomain, string> = {
        acteurs: acteursSourceDirectoryName,
        scrutins: scrutinsSourceDirectoryName,
        mandats: mandatsSourceDirectoryName
    };

    static create(config: ParserJobRunnerConfig): { job: ParserJob; outputDir: string } {
        const logger = new Logger(config.logLevel || LogLevel.INFO);

        const sourceDir = path.resolve(
            __dirname,
            baseInData,
            this.SOURCE_DIRS[config.domain]
        );

        const outputDir = path.resolve(__dirname, baseOutData, outTableDirectoryName);

        // Infrastructure
        const fileSource = new DirectorySource(sourceDir);
        const ExtractorClass = this.EXTRACTORS[config.domain];
        const extractor = new ExtractorClass();
        const fileWriter = new JsonFileWriter();

        // Domain
        const processor = new BatchProcessor(fileSource, extractor, logger);

        // Use Case
        const parseUseCase = new ParseFilesUseCase(processor, fileWriter, logger);

        // Job
        const job = new ParserJob(parseUseCase, logger);

        return { job, outputDir };
    }

    static async runAll(logLevel: LogLevel = LogLevel.INFO): Promise<void> {
        const logger = new Logger(logLevel);

        logger.info('======== Starting Parser Jobs ========');

        const domains: ParserDomain[] = ['acteurs', 'scrutins', 'mandats'];

        for (let i = 0; i < domains.length; i++) {
            const domain = domains[i];
            logger.info(`📋 Job ${i + 1}/${domains.length}: Parsing ${domain}...`);

            const { job, outputDir } = this.create({ domain, logLevel });

            await job.run({
                outputDir,
                exportSeparateFiles: true,
                exportSingleFile: false
            });
        }

        logger.info('='.repeat(25));
        logger.success('🎉 Tous les extractors ont terminé !');
        logger.info('='.repeat(25));
    }
}