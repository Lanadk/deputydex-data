jest.mock('https');

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as https from 'https';
import { EventEmitter } from 'events';
import { FileDownloader } from './FileDownloader';
import { Logger } from '../../../../utils/logger';

const mockedGet = https.get as unknown as jest.Mock;

function createMockLogger(): jest.Mocked<Logger> {
    return { debug: jest.fn(), info: jest.fn(), success: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as jest.Mocked<Logger>;
}

/**
 * Builds a fake http.IncomingMessage-like object. `.pipe(dest)` is stubbed
 * to immediately call `dest.end()`, simulating "the source stream has been
 * fully consumed" without needing a real Readable — the test then controls
 * exactly when 'data'/'close' fire on the response relative to that,
 * deterministically, by emitting them itself right after calling download().
 */
function fakeResponse(overrides: Partial<{ statusCode: number; statusMessage: string; headers: Record<string, string>; complete: boolean }> = {}) {
    const response = new EventEmitter() as EventEmitter & {
        statusCode: number;
        statusMessage: string;
        headers: Record<string, string>;
        complete: boolean;
        pipe: jest.Mock;
        resume: jest.Mock;
    };
    response.statusCode = overrides.statusCode ?? 200;
    response.statusMessage = overrides.statusMessage ?? 'OK';
    response.headers = overrides.headers ?? {};
    response.complete = overrides.complete ?? true;
    response.resume = jest.fn();
    response.pipe = jest.fn((dest: fs.WriteStream) => {
        dest.end();
        return dest;
    });
    return response;
}

function fakeRequest() {
    const request = new EventEmitter() as EventEmitter & { destroy: jest.Mock };
    // Comme http.ClientRequest : destroy(err) émet 'error'.
    request.destroy = jest.fn((err?: Error) => {
        if (err) request.emit('error', err);
    });
    return request;
}

describe('FileDownloader', () => {
    // A single shared directory for the whole file, torn down only once at
    // the very end: several failure-path tests call file.destroy() right
    // after fs.createWriteStream() opens it, whose underlying async fs.open()
    // can still be settling in the background. Deleting a per-test tmp dir
    // in afterEach races that, occasionally surfacing as an ENOENT on an
    // unrelated later test. A directory that outlives every test sidesteps
    // the race entirely.
    let workDir: string;
    let dest: string;
    let fileCounter = 0;

    beforeAll(() => {
        workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-downloader-spec-'));
    });

    afterAll(() => {
        // Même race qu'au-dessus, à la fin du fichier : un fs.open() async d'un
        // write stream détruit peut encore créer son fichier pendant que
        // rmSync vide le dossier -> ENOTEMPTY sur le rmdir final (vu en CI).
        // maxRetries réessaie justement sur ENOTEMPTY/EBUSY.
        fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    });

    beforeEach(() => {
        dest = path.join(workDir, `out-${++fileCounter}.zip`);
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.useRealTimers();
    });

    describe('download', () => {
        it('resolves once the transfer completes and matches content-length', async () => {
            const response = fakeResponse({ headers: { 'content-length': '5' } });
            const request = fakeRequest();
            mockedGet.mockImplementation((_url: string, _options: unknown, cb: (res: typeof response) => void) => {
                cb(response);
                return request;
            });
            const downloader = new FileDownloader(createMockLogger());

            const promise = downloader.download('https://x/a.zip', dest);
            response.emit('data', Buffer.from('hello'));
            response.emit('close');

            await expect(promise).resolves.toBeUndefined();
            expect(fs.existsSync(dest)).toBe(true);
        });

        it('rejects with the HTTP status for a non-200 response, draining it via resume()', async () => {
            const response = fakeResponse({ statusCode: 404, statusMessage: 'Not Found' });
            mockedGet.mockImplementation((_url: string, _options: unknown, cb: (res: typeof response) => void) => {
                cb(response);
                return fakeRequest();
            });
            const downloader = new FileDownloader(createMockLogger());

            await expect(downloader.download('https://x/missing.zip', dest)).rejects.toThrow('HTTP 404: Not Found');
            expect(response.resume).toHaveBeenCalledTimes(1);
        });

        it('rejects and removes the partial file when the transfer is truncated', async () => {
            const response = fakeResponse({ headers: { 'content-length': '10' } });
            // The 'close'-triggered rejection settles (and destroys the file
            // stream) before 'finish' would ever matter here: skip the
            // pipe->end() simulation so we never race an async fs.open()
            // against this test's own afterEach tearing workDir down.
            response.pipe = jest.fn();
            mockedGet.mockImplementation((_url: string, _options: unknown, cb: (res: typeof response) => void) => {
                cb(response);
                return fakeRequest();
            });
            const downloader = new FileDownloader(createMockLogger());

            const promise = downloader.download('https://x/a.zip', dest);
            response.emit('data', Buffer.from('hello')); // only 5 of the announced 10 bytes
            response.emit('close');

            await expect(promise).rejects.toThrow('Truncated download (5/10 bytes)');
            expect(fs.existsSync(dest)).toBe(false);
        });

        it('rejects on a request-level error (e.g. DNS/connection failure)', async () => {
            const request = fakeRequest();
            mockedGet.mockImplementation(() => request);
            const downloader = new FileDownloader(createMockLogger());

            const promise = downloader.download('https://unreachable/a.zip', dest);
            request.emit('error', new Error('ECONNREFUSED'));

            await expect(promise).rejects.toThrow('ECONNREFUSED');
        });

        it('passes an idle timeout to the request', async () => {
            const request = fakeRequest();
            mockedGet.mockImplementation(() => request);
            const downloader = new FileDownloader(createMockLogger());

            const promise = downloader.download('https://x/a.zip', dest);
            request.emit('error', new Error('stop'));
            await expect(promise).rejects.toThrow('stop');

            expect(mockedGet).toHaveBeenCalledWith('https://x/a.zip', { timeout: 60_000 }, expect.any(Function));
        });

        it('aborts and rejects when the connection stays idle (timeout event)', async () => {
            const request = fakeRequest();
            mockedGet.mockImplementation(() => request);
            const downloader = new FileDownloader(createMockLogger());

            const promise = downloader.download('https://x/slow.zip', dest);
            request.emit('timeout');

            await expect(promise).rejects.toThrow('No data received for 60s: https://x/slow.zip');
            expect(request.destroy).toHaveBeenCalledTimes(1);
        });
    });

    describe('downloadWithRetry', () => {
        it('succeeds on the first attempt without retrying', async () => {
            const response = fakeResponse({ headers: { 'content-length': '5' } });
            mockedGet.mockImplementation((_url: string, _options: unknown, cb: (res: typeof response) => void) => {
                cb(response);
                return fakeRequest();
            });
            const logger = createMockLogger();
            const downloader = new FileDownloader(logger);

            const promise = downloader.downloadWithRetry('https://x/a.zip', dest, 3);
            response.emit('data', Buffer.from('hello'));
            response.emit('close');
            await promise;

            expect(mockedGet).toHaveBeenCalledTimes(1);
        });

        it('retries after a failed attempt and succeeds on a later one', async () => {
            jest.useFakeTimers();
            let call = 0;
            mockedGet.mockImplementation((_url: string, _options: unknown, cb: (res: ReturnType<typeof fakeResponse>) => void) => {
                call++;
                if (call === 1) {
                    cb(fakeResponse({ statusCode: 500, statusMessage: 'Server Error' }));
                } else {
                    const response = fakeResponse({ headers: { 'content-length': '5' } });
                    // schedule the response events for after the caller attaches its listeners
                    queueMicrotask(() => {
                        response.emit('data', Buffer.from('hello'));
                        response.emit('close');
                    });
                    cb(response);
                }
                return fakeRequest();
            });
            const downloader = new FileDownloader(createMockLogger());

            const promise = downloader.downloadWithRetry('https://x/a.zip', dest, 3);
            await jest.advanceTimersByTimeAsync(2000); // covers the 1000ms backoff after attempt 1
            await promise;

            expect(mockedGet).toHaveBeenCalledTimes(2);
        });

        it('throws after exhausting all retries', async () => {
            jest.useFakeTimers();
            mockedGet.mockImplementation((_url: string, _options: unknown, cb: (res: ReturnType<typeof fakeResponse>) => void) => {
                cb(fakeResponse({ statusCode: 503, statusMessage: 'Unavailable' }));
                return fakeRequest();
            });
            const logger = createMockLogger();
            const downloader = new FileDownloader(logger);

            const promise = downloader.downloadWithRetry('https://x/a.zip', dest, 2);
            const assertion = expect(promise).rejects.toThrow('Failed after 2 attempts: HTTP 503: Unavailable');
            await jest.advanceTimersByTimeAsync(5000);
            await assertion;

            expect(mockedGet).toHaveBeenCalledTimes(2);
            expect(logger.warn).toHaveBeenCalledTimes(2);
        });

        it('backs off exponentially and caps the wait at 30s', async () => {
            jest.useFakeTimers();
            mockedGet.mockImplementation((_url: string, _options: unknown, cb: (res: ReturnType<typeof fakeResponse>) => void) => {
                cb(fakeResponse({ statusCode: 503, statusMessage: 'Unavailable' }));
                return fakeRequest();
            });
            const logger = createMockLogger();
            const downloader = new FileDownloader(logger);

            const promise = downloader.downloadWithRetry('https://x/a.zip', dest, 7);
            const assertion = expect(promise).rejects.toThrow('Failed after 7 attempts');
            await jest.advanceTimersByTimeAsync(200_000);
            await assertion;

            const delays = logger.info.mock.calls
                .map(([msg]) => /Retrying in (\d+)ms/.exec(String(msg))?.[1])
                .filter((d): d is string => !!d)
                .map(Number);
            expect(delays).toEqual([1000, 2000, 4000, 8000, 16000, 30000]);
        });
    });
});
