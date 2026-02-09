import fs from 'fs';
import path from 'path';
import {ExportSummary, IJsonFileWriter} from "../IJsonFileWriter";
import {formatJsonForImport} from "../../../../utils/utils";

export class JsonFileWriter implements IJsonFileWriter {
    private summary: ExportSummary = {
        totalTables: 0,
        totalRecords: 0,
        tables: {},
        errors: 0
    };

    writeToSingleFile(data: Record<string, any[]>, outputPath: string): void {
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
        this.updateSummary(data, 0);
    }

    writeToSeparateFiles(data: Record<string, any[]>, outputDir: string): void {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        for (const [tableName, records] of Object.entries(data)) {
            const filePath = path.join(outputDir, `${tableName}.json`);
            formatJsonForImport(records, filePath);
        }

        this.updateSummary(data, 0);
    }

    writeErrors(errors: { file: string; error: string }[], outputPath: string): void {
        if (errors.length === 0) return;

        const errorsPath = outputPath.includes('.json')
            ? outputPath.replace(/\.json$/, '-errors.json')
            : path.join(outputPath, 'errors.json');

        fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2), 'utf-8');
        this.summary.errors = errors.length;
    }

    getSummary(): ExportSummary {
        return { ...this.summary };
    }

    private updateSummary(data: Record<string, any[]>, errorCount: number): void {
        this.summary.totalTables = Object.keys(data).length;
        this.summary.totalRecords = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);
        this.summary.tables = Object.fromEntries(
            Object.entries(data).map(([name, records]) => [name, records.length])
        );
        this.summary.errors = errorCount;
    }
}