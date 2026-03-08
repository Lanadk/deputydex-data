import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const closeStream = (stream: fs.WriteStream): Promise<void> =>
    new Promise(resolve => stream.end(resolve));

async function splitJsonFile(inputFile: string, maxSizeMB: number): Promise<void> {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const baseName = path.basename(inputFile, '.json');
    const dirName = path.dirname(inputFile);

    let partNumber = 1;
    let currentSize = 0;
    const partFiles: string[] = [];

    const createNewPart = (): fs.WriteStream => {
        const partFile = path.join(dirName, `${baseName}_part${partNumber}.json`);
        partFiles.push(partFile);
        partNumber++;
        currentSize = 0;
        return fs.createWriteStream(partFile);
    };

    let outputStream = createNewPart();

    const fileStream = fs.createReadStream(inputFile);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (!line.trim()) continue;
        const lineSize = Buffer.byteLength(line + '\n', 'utf8');

        if (currentSize + lineSize > maxSizeBytes && currentSize > 0) {
            await closeStream(outputStream);
            outputStream = createNewPart();
        }

        outputStream.write(line + '\n');
        currentSize += lineSize;
    }

    await closeStream(outputStream);
    partFiles.forEach(f => console.log(f));
}

const [inputFile, maxSizeMB] = process.argv.slice(2);

if (!inputFile || !maxSizeMB) {
    console.error('[ERROR  ❌ ]: Usage: ts-node json-splitter.ts <input-file> <max-size-mb>');
    process.exit(1);
}

splitJsonFile(inputFile, parseInt(maxSizeMB))
    .catch(err => {
        console.error('[ERROR  ❌ ]: Split error:', err.message);
        process.exit(1);
    });