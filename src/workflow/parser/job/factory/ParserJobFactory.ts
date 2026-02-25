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
import fs from "fs";
import {DirectorySource} from "../../infrastructure/impl/DirectorySource";
import {JsonFileWriter} from "../../infrastructure/impl/JsonFileWriter";
import {BatchProcessor} from "../../domain/models/BatchProcessor";
import {ParseFilesUseCase} from "../../domain/usecases/ParseFilesUseCase";
import {MandatsExtractor} from "../../domain/models/MandatExtractor";

export type ParserDomain = 'acteurs' | 'scrutins' | 'mandats';

export interface ParserJobRunnerConfig {
    domain: ParserDomain;
    legislature: number;
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
            config.legislature.toString(),
            this.SOURCE_DIRS[config.domain],
        );

        const outputDir = path.resolve(__dirname, baseOutData, outTableDirectoryName, config.legislature.toString());

        const fileSource = new DirectorySource(sourceDir);
        const ExtractorClass = this.EXTRACTORS[config.domain];
        const extractor = new ExtractorClass();
        const fileWriter = new JsonFileWriter();

        const processor = new BatchProcessor(fileSource, extractor, logger);
        const parseUseCase = new ParseFilesUseCase(processor, fileWriter, logger);
        const job = new ParserJob(parseUseCase, logger);

        return { job, outputDir };
    }

    static async runAll(logLevel: LogLevel = LogLevel.INFO): Promise<void> {
        const logger = new Logger(logLevel);
        logger.info('======== Starting Parser Jobs ========');

        const legislatures = this.getAvailableLegislatures();

        if (legislatures.length === 0) {
            logger.warn(`No legislature directories found in ${path.resolve(__dirname, baseInData)}`);
            return;
        }

        logger.info(`🏛️  Législatures trouvées : ${legislatures.join(', ')}`);

        const domains: ParserDomain[] = ['acteurs', 'scrutins', 'mandats'];

        for (const legislature of legislatures) {
            logger.info(`\n📅 Legislature ${legislature}`);

            for (let i = 0; i < domains.length; i++) {
                const domain = domains[i];
                logger.info(`  📋 Job ${i + 1}/${domains.length}: Parsing ${domain}...`);

                const { job, outputDir } = this.create({ domain, legislature, logLevel });

                await job.run({
                    outputDir,
                    exportSeparateFiles: true,
                    exportSingleFile: false
                });
            }
        }

        logger.info('='.repeat(25));
        logger.success('🎉 Tous les extractors ont terminé !');
        logger.info('='.repeat(25));
    }

    private static getAvailableLegislatures(): number[] {
        const unzipBaseDir = path.resolve(__dirname, baseInData);

        if (!fs.existsSync(unzipBaseDir)) {
            return [];
        }

        return fs.readdirSync(unzipBaseDir)
            .filter(entry => fs.statSync(path.join(unzipBaseDir, entry)).isDirectory())
            .map(Number)
            .filter(n => !isNaN(n))
            .sort();
    }
}