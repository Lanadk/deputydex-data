import crypto from 'crypto';
import fs from 'fs';
import {IFileVerifier} from "../IFileVerifier";

export class FileVerifier implements IFileVerifier {
    async calculateChecksum(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);

            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    async verifyChecksum(filePath: string, expectedChecksum: string): Promise<boolean> {
        const actualChecksum = await this.calculateChecksum(filePath);
        return actualChecksum === expectedChecksum;
    }

    async getFileSize(filePath: string): Promise<bigint> {
        const stats = fs.statSync(filePath);
        return BigInt(stats.size);
    }
}