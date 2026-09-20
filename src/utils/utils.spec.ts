import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { formatJsonForImport } from './utils';

describe('formatJsonForImport', () => {
    let workDir: string;

    beforeEach(() => {
        workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'format-json-spec-'));
    });

    afterEach(() => {
        fs.rmSync(workDir, { recursive: true, force: true });
    });

    it('writes one JSON object per line (NDJSON)', async () => {
        const outputFile = path.join(workDir, 'out.ndjson');
        await formatJsonForImport([{ a: 1 }, { b: 2 }], outputFile);

        const content = fs.readFileSync(outputFile, 'utf-8');
        const lines = content.trim().split('\n');
        expect(lines).toHaveLength(2);
        expect(JSON.parse(lines[0])).toEqual({ a: 1 });
        expect(JSON.parse(lines[1])).toEqual({ b: 2 });
    });

    it('escapes special characters (quotes, newlines) via JSON.stringify', async () => {
        const outputFile = path.join(workDir, 'special.ndjson');
        await formatJsonForImport([{ text: 'a "quoted"\nvalue' }], outputFile);

        const content = fs.readFileSync(outputFile, 'utf-8');
        expect(JSON.parse(content.trim())).toEqual({ text: 'a "quoted"\nvalue' });
    });

    it('writes an empty file when given no data', async () => {
        const outputFile = path.join(workDir, 'empty.ndjson');
        await formatJsonForImport([], outputFile);

        expect(fs.readFileSync(outputFile, 'utf-8')).toBe('');
    });

    it('appends to an existing file instead of truncating it when append is true', async () => {
        const outputFile = path.join(workDir, 'appended.ndjson');
        await formatJsonForImport([{ a: 1 }], outputFile);
        await formatJsonForImport([{ b: 2 }], outputFile, { append: true });

        const lines = fs.readFileSync(outputFile, 'utf-8').trim().split('\n');
        expect(lines.map(l => JSON.parse(l))).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it('truncates an existing file when append is false (default)', async () => {
        const outputFile = path.join(workDir, 'truncated.ndjson');
        await formatJsonForImport([{ a: 1 }, { b: 2 }], outputFile);
        await formatJsonForImport([{ c: 3 }], outputFile);

        const lines = fs.readFileSync(outputFile, 'utf-8').trim().split('\n');
        expect(lines.map(l => JSON.parse(l))).toEqual([{ c: 3 }]);
    });
});
