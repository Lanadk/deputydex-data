#!/usr/bin/env ts-node

import {LogLevel} from "../../../utils/logger";
import {ParserJobFactory} from "./factory/ParserJobFactory";


async function main() {
    try {
        await ParserJobFactory.runAll(LogLevel.DEBUG);
    } catch (error) {
        console.error('[ERROR  ❌ ]: Parser jobs failed:', error);
        process.exit(1);
    }
}

main().catch(console.error);