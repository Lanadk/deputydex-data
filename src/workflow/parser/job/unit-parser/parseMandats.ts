#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { resolve } from 'path';
import {existsSync} from "fs";

import {LogLevel} from "../../../../utils/logger";
import {ParserJobFactory} from "../factory/ParserJobFactory";

// Load env
const rootDir = resolve(__dirname, '../../../../..');
const envPath = resolve(rootDir, '.env.local');
if (existsSync(envPath)) config({ path: envPath });

async function main() {
    try {
        const { job, outputDir } = ParserJobFactory.create({
            domain: 'mandats',
            logLevel: LogLevel.INFO
        });

        await job.run({
            outputDir,
            exportSeparateFiles: true,
            exportSingleFile: false
        });

    } catch (error) {
        console.error('[ERROR  ❌ ]: Job failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

export { main };