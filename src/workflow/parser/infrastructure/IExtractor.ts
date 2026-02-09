export interface IExtractor {
    processFile(filePath: string, data?: any): Promise<void> | void;
    getTables(): Record<string, any[]>;
    getErrors(): { file: string; error: string }[];
}