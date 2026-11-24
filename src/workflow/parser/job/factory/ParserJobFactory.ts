import {IExtractor} from "../../infrastructure/IExtractor";
import {Logger, LogLevel} from "../../../../utils/logger";
import {ActeursExtractor} from "../../domain/models/ActeursExtractor";
import {OrganesExtractor} from "../../domain/models/OrganesExtractor";
import {ScrutinsExtractor} from "../../domain/models/ScrutinsExtractor";
import { AmendementExtractor } from '../../domain/models/AmendementExtractor';
import {
    acteursSourceDirectoryName,
    organesSourceDirectoryName,
    baseInData,
    baseOutData,
    outTableDirectoryName,
    scrutinsSourceDirectoryName,
    amendementsSourceDirectoryName, dossiersSourceDirectoryName, documentsSourceDirectoryName,
    reunionsSourceDirectoryName, questionsSourceDirectoryNames, debatsSourceDirectoryName,
    parseFlushEveryFiles, debatsFlushEveryFiles
} from "../const";
import {ReunionsExtractor} from "../../domain/models/ReunionsExtractor";
import {QuestionsExtractor} from "../../domain/models/QuestionsExtractor";
import {DebatsExtractor} from "../../domain/models/DebatsExtractor";
import {IDirectorySource} from "../../infrastructure/IDirectorySource";
import {ParserJob} from "../parser/ParserJob";
import path from "path";
import fs from "fs";
import {DirectorySource} from "../../infrastructure/impl/DirectorySource";
import {JsonFileWriter} from "../../infrastructure/impl/JsonFileWriter";
import {BatchProcessor} from "../../domain/models/BatchProcessor";
import {ParseFilesUseCase} from "../../domain/usecases/ParseFilesUseCase";
import {DossiersParlementairesExtractor} from "../../domain/models/DossierParlementaireExtractor";
import {DocumentParlementaireExtractor} from "../../domain/models/DocumentParlementaireExtractor";

export type ParserDomain = 'acteurs' | 'organes' | 'scrutins' | 'amendements' | 'dossiers_legislatifs' | 'documents_parlementaires' | 'reunions' | 'questions' | 'debats';

const ALL_DOMAINS: ParserDomain[] = ['acteurs', 'organes', 'scrutins', 'amendements', 'dossiers_legislatifs', 'documents_parlementaires', 'reunions', 'questions', 'debats'];

export interface ParserJobRunnerConfig {
    domain: ParserDomain;
    legislature: number;
    logLevel?: LogLevel;
}

export class ParserJobFactory {

    /** Un domaine peut lire plusieurs répertoires (ex. les trois archives de questions). */
    private static readonly SOURCE_DIRS: Record<ParserDomain, string | string[]> = {
        acteurs: acteursSourceDirectoryName,
        organes: organesSourceDirectoryName,
        scrutins: scrutinsSourceDirectoryName,
        amendements: amendementsSourceDirectoryName,
        dossiers_legislatifs: dossiersSourceDirectoryName,
        documents_parlementaires: documentsSourceDirectoryName,
        reunions: reunionsSourceDirectoryName,
        questions: questionsSourceDirectoryNames,
        debats: debatsSourceDirectoryName,
    };

    /** Extension des fichiers sources, quand ce n'est pas `.json`. */
    private static readonly SOURCE_EXTENSIONS: Partial<Record<ParserDomain, string>> = {
        debats: '.xml',
    };

    /** Fréquence de vidage mémoire, quand elle diffère de `parseFlushEveryFiles`. */
    private static readonly FLUSH_EVERY_FILES: Partial<Record<ParserDomain, number>> = {
        debats: debatsFlushEveryFiles,
    };

    // ==============================================================================
    // Instanciation des extractors avec legislature_snapshot
    // ==============================================================================
    private static createExtractor(domain: ParserDomain, legislatureSnapshot: number): IExtractor {
        switch (domain) {
            case 'acteurs':  return new ActeursExtractor(legislatureSnapshot);
            case 'organes':  return new OrganesExtractor(legislatureSnapshot);
            case 'scrutins': return new ScrutinsExtractor(legislatureSnapshot);
            case "amendements": return new AmendementExtractor(legislatureSnapshot);
            case "dossiers_legislatifs": return new DossiersParlementairesExtractor(legislatureSnapshot);
            case "documents_parlementaires": return new DocumentParlementaireExtractor(legislatureSnapshot);
            case "reunions": return new ReunionsExtractor(legislatureSnapshot);
            case "questions": return new QuestionsExtractor(legislatureSnapshot);
            case "debats": return new DebatsExtractor(legislatureSnapshot);
        }}

    /**
     * Fichiers de tous les répertoires sources du domaine, dans l'ordre déclaré.
     * Chaque répertoire est lu par un DirectorySource : un répertoire manquant
     * (téléchargement raté) fait échouer le parsing au lieu d'être ignoré.
     */
    private static createFileSource(domain: ParserDomain, legislature: number): IDirectorySource {
        const dirs = ([] as string[]).concat(this.SOURCE_DIRS[domain])
            .map((dir) => path.resolve(__dirname, baseInData, legislature.toString(), dir));
        const extension = this.SOURCE_EXTENSIONS[domain];
        if (dirs.length === 1) return new DirectorySource(dirs[0], extension);
        return { getFiles: () => dirs.flatMap((dir) => new DirectorySource(dir, extension).getFiles()) };
    }

    static create(config: ParserJobRunnerConfig): { job: ParserJob; outputDir: string } {
        const logger = new Logger(config.logLevel || LogLevel.INFO);

        const outputDir = path.resolve(__dirname, baseOutData, outTableDirectoryName, config.legislature.toString());

        const fileSource = this.createFileSource(config.domain, config.legislature);
        const extractor = this.createExtractor(config.domain, config.legislature);
        const fileWriter = new JsonFileWriter();

        const processor = new BatchProcessor(fileSource, extractor, logger, {
            everyFiles: this.FLUSH_EVERY_FILES[config.domain] ?? parseFlushEveryFiles,
            onFlush: (tables) => fileWriter.writeToSeparateFiles(tables, outputDir),
        });
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

        const domains = ALL_DOMAINS;

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

    static async runByDomain(domain: ParserDomain, logLevel: LogLevel = LogLevel.INFO): Promise<void> {
        const logger = new Logger(logLevel);
        logger.info(`======== Starting Parser Job: ${domain} ========`);

        const legislatures = this.getAvailableLegislatures();

        if (legislatures.length === 0) {
            logger.warn(`No legislature directories found`);
            return;
        }

        logger.info(`🏛️  Législatures trouvées : ${legislatures.join(', ')}`);

        for (const legislature of legislatures) {
            logger.info(`\n📅 Legislature ${legislature}`);

            const { job, outputDir } = this.create({ domain, legislature, logLevel });

            await job.run({
                outputDir,
                exportSeparateFiles: true,
                exportSingleFile: false
            });
        }

        logger.info('='.repeat(25));
        logger.success(`🎉 ${domain} parser terminé !`);
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
            .filter(n => !Number.isNaN(n))
            .sort();
    }
}