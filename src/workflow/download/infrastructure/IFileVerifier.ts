export interface IFileVerifier {
    calculateChecksum(filePath: string): Promise<string>;
    verifyChecksum(filePath: string, expected: string): Promise<boolean>;
    getFileSize(filePath: string): Promise<bigint>;
}