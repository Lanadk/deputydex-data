import { BatchProcessor } from './BatchProcessor';
import { IDirectorySource } from '../../infrastructure/IDirectorySource';
import { IExtractor } from '../../infrastructure/IExtractor';
import { Logger } from '../../../../utils/logger';

function createMockLogger(): jest.Mocked<Logger> {
    return {
        debug: jest.fn(),
        info: jest.fn(),
        success: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;
}

function createMockDirectorySource(files: string[]): jest.Mocked<IDirectorySource> {
    return { getFiles: jest.fn().mockReturnValue(files) };
}

function createMockExtractor(): jest.Mocked<IExtractor> {
    return {
        processFile: jest.fn().mockResolvedValue(undefined),
        getTables: jest.fn().mockReturnValue({}),
        getErrors: jest.fn().mockReturnValue([]),
        clearTables: jest.fn(),
    };
}

describe('BatchProcessor', () => {
    let stdoutSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('processes every file returned by the directory source, in order', async () => {
        const directorySource = createMockDirectorySource(['a.json', 'b.json', 'c.json']);
        const extractor = createMockExtractor();
        const logger = createMockLogger();
        const processor = new BatchProcessor(directorySource, extractor, logger);

        await processor.process();

        expect(extractor.processFile).toHaveBeenCalledTimes(3);
        expect(extractor.processFile.mock.calls.map(c => c[0])).toEqual(['a.json', 'b.json', 'c.json']);
        expect(processor.getProcessedFilesCount()).toBe(3);
        expect(logger.success).toHaveBeenCalledWith('Processing complete!');
    });

    it('warns and processes nothing when the directory source has no files', async () => {
        const directorySource = createMockDirectorySource([]);
        const extractor = createMockExtractor();
        const logger = createMockLogger();
        const processor = new BatchProcessor(directorySource, extractor, logger);

        await processor.process();

        expect(extractor.processFile).not.toHaveBeenCalled();
        expect(processor.getProcessedFilesCount()).toBe(0);
        expect(logger.warn).toHaveBeenCalledWith('No files found to process');
    });

    it('logs a per-file error and keeps processing the remaining files when processFile rejects', async () => {
        const directorySource = createMockDirectorySource(['a.json', 'bad.json', 'c.json']);
        const extractor = createMockExtractor();
        extractor.processFile.mockImplementation(async (file: string) => {
            if (file === 'bad.json') throw new Error('boom');
        });
        const logger = createMockLogger();
        const processor = new BatchProcessor(directorySource, extractor, logger);

        await processor.process();

        expect(extractor.processFile).toHaveBeenCalledTimes(3);
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('bad.json'));
        expect(processor.getProcessedFilesCount()).toBe(3);
    });

    it('delegates getTables and getErrors to the extractor', () => {
        const directorySource = createMockDirectorySource([]);
        const extractor = createMockExtractor();
        const tables = { foo: [{ id: 1 }] };
        const errors = [{ file: 'x.json', error: 'oops' }];
        extractor.getTables.mockReturnValue(tables);
        extractor.getErrors.mockReturnValue(errors);
        const processor = new BatchProcessor(directorySource, extractor, createMockLogger());

        expect(processor.getTables()).toBe(tables);
        expect(processor.getErrors()).toBe(errors);
    });

    describe('periodic flush', () => {
        it('is not configured by default', () => {
            const processor = new BatchProcessor(createMockDirectorySource([]), createMockExtractor(), createMockLogger());
            expect(processor.isFlushConfigured()).toBe(false);
        });

        it('reports flush as configured when flush options are passed', () => {
            const processor = new BatchProcessor(
                createMockDirectorySource([]),
                createMockExtractor(),
                createMockLogger(),
                { everyFiles: 2, onFlush: jest.fn() }
            );
            expect(processor.isFlushConfigured()).toBe(true);
        });

        it('flushes and clears the extractor every N files, but not after the last file', async () => {
            const directorySource = createMockDirectorySource(['a.json', 'b.json', 'c.json', 'd.json']);
            const extractor = createMockExtractor();
            const onFlush = jest.fn().mockResolvedValue(undefined);
            const processor = new BatchProcessor(
                directorySource,
                extractor,
                createMockLogger(),
                { everyFiles: 2, onFlush }
            );

            await processor.process();

            // Flushes after file 2 and file 4 would double-count the tail, so the
            // last file's batch is left for the caller to read and write itself.
            expect(onFlush).toHaveBeenCalledTimes(1);
            expect(extractor.clearTables).toHaveBeenCalledTimes(1);
        });

        it('never flushes when the file count never reaches a full batch', async () => {
            const directorySource = createMockDirectorySource(['a.json']);
            const extractor = createMockExtractor();
            const onFlush = jest.fn().mockResolvedValue(undefined);
            const processor = new BatchProcessor(
                directorySource,
                extractor,
                createMockLogger(),
                { everyFiles: 10, onFlush }
            );

            await processor.process();

            expect(onFlush).not.toHaveBeenCalled();
            expect(extractor.clearTables).not.toHaveBeenCalled();
        });
    });
});
