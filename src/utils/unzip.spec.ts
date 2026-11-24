import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { unzipFile } from './unzip';

describe('unzipFile', () => {
    let workDir: string;

    beforeEach(() => {
        workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unzip-spec-'));
    });

    afterEach(() => {
        fs.rmSync(workDir, { recursive: true, force: true });
    });

    it('throws when the zip file does not exist', async () => {
        const missing = path.join(workDir, 'missing.zip');

        await expect(unzipFile(missing, path.join(workDir, 'out'))).rejects.toThrow(
            /does not exist/
        );
    });

    it('creates the target directory when it is missing', async () => {
        const zip = new AdmZip();
        zip.addFile('data.json', Buffer.from('{"ok":true}'));
        const zipPath = path.join(workDir, 'archive.zip');
        zip.writeZip(zipPath);

        const targetDir = path.join(workDir, 'nested', 'out');
        expect(fs.existsSync(targetDir)).toBe(false);

        await unzipFile(zipPath, targetDir);

        expect(fs.existsSync(targetDir)).toBe(true);
    });

    it('extracts the archive content into the target directory', async () => {
        const zip = new AdmZip();
        zip.addFile('data.json', Buffer.from('{"ok":true}'));
        zip.addFile('sub/nested.txt', Buffer.from('hello'));
        const zipPath = path.join(workDir, 'archive.zip');
        zip.writeZip(zipPath);

        const targetDir = path.join(workDir, 'out');
        await unzipFile(zipPath, targetDir);

        expect(fs.readFileSync(path.join(targetDir, 'data.json'), 'utf-8')).toBe('{"ok":true}');
        expect(fs.readFileSync(path.join(targetDir, 'sub', 'nested.txt'), 'utf-8')).toBe('hello');
    });

    function writeZip(name: string, files: Record<string, string>): string {
        const zip = new AdmZip();
        for (const [entry, content] of Object.entries(files)) zip.addFile(entry, Buffer.from(content));
        const zipPath = path.join(workDir, name);
        zip.writeZip(zipPath);
        return zipPath;
    }

    it('remplace le contenu précédent : les fichiers retirés de l\'archive disparaissent', async () => {
        const targetDir = path.join(workDir, 'out');
        await unzipFile(writeZip('v1.zip', { 'a.json': 'v1', 'retire.json': 'v1' }), targetDir);

        await unzipFile(writeZip('v2.zip', { 'a.json': 'v2', 'nouveau.json': 'v2' }), targetDir);

        expect(fs.readdirSync(targetDir).sort()).toEqual(['a.json', 'nouveau.json']);
        expect(fs.readFileSync(path.join(targetDir, 'a.json'), 'utf-8')).toBe('v2');
    });

    it('une archive illisible laisse le contenu précédent intact et aucun dossier temporaire', async () => {
        const targetDir = path.join(workDir, 'out');
        await unzipFile(writeZip('v1.zip', { 'a.json': 'v1' }), targetDir);
        const corrompu = path.join(workDir, 'corrompu.zip');
        fs.writeFileSync(corrompu, 'pas une archive');

        await expect(unzipFile(corrompu, targetDir)).rejects.toThrow();

        expect(fs.readFileSync(path.join(targetDir, 'a.json'), 'utf-8')).toBe('v1');
        expect(fs.readdirSync(workDir).filter((e) => e.includes('.extract-') || e.includes('.previous-'))).toEqual([]);
    });

    it('ne laisse aucun dossier temporaire après un remplacement réussi', async () => {
        const targetDir = path.join(workDir, 'out');
        await unzipFile(writeZip('v1.zip', { 'a.json': 'v1' }), targetDir);
        await unzipFile(writeZip('v2.zip', { 'a.json': 'v2' }), targetDir);

        expect(fs.readdirSync(workDir).sort()).toEqual(['out', 'v1.zip', 'v2.zip']);
    });
});
