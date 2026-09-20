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

    // Tracks which output files this instance has already written to, so a
    // periodic flush mid-run appends instead of re-truncating earlier batches.
    private initializedFiles = new Set<string>();

    writeToSingleFile(data: Record<string, any[]>, outputPath: string): void {
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
        this.accumulateSummary(data);
    }

    async writeToSeparateFiles(data: Record<string, any[]>, outputDir: string): Promise<void> {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        await Promise.all(Object.entries(data).map(([tableName, records]) => {
            const filePath = path.join(outputDir, `${tableName}.json`);
            const append = this.initializedFiles.has(filePath);
            this.initializedFiles.add(filePath);
            return formatJsonForImport(records, filePath, { append });
        }));

        this.accumulateSummary(data);
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

    // Adds to the running totals rather than replacing them, since a flushed
    // domain calls this once per batch instead of once for the whole dataset.
    private accumulateSummary(data: Record<string, any[]>): void {
        for (const [name, records] of Object.entries(data)) {
            this.summary.tables[name] = (this.summary.tables[name] ?? 0) + records.length;
        }
        this.summary.totalTables = Object.keys(this.summary.tables).length;
        this.summary.totalRecords = Object.values(this.summary.tables).reduce((sum, count) => sum + count, 0);
    }
}