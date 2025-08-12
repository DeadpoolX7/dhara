#!/usr/bin/env bun

import { Command } from "commander";
import path from "path";
import fs from "fs";
import { startServer } from "../src/server";
import { zipFiles } from "../src/zip";
import { startReceiver } from "../src/server";
import crypto from "crypto";

const program = new Command();

program
    .name("dhara")
    .description("Instant file sharing via QR code")
    .version("0.1.0");

program
    .argument("<file...>", "File(s) to share")
    .option("-m, --multiple", "Share multiple files as zip")
    .action(async (files, options) => {
        const resolvedFiles = files.map((f: string) => path.resolve(f));

        for (const f of resolvedFiles) {
            if (!fs.existsSync(f)) {
                console.error(`❌ File not found: ${f}`);
                process.exit(1);
            }
        }

        let fileToServe: string;

        // If multiple files OR any directory => zip
        interface ShareOptions {
            multiple?: boolean;
        }

                if (
                    (options as ShareOptions).multiple ||
                    resolvedFiles.length > 1 ||
                    resolvedFiles.some((p: string) => fs.statSync(p).isDirectory())
                ) {
                    fileToServe = await zipFiles(resolvedFiles as string[]);
                } else {
                    fileToServe = resolvedFiles[0] as string;
                }


        startServer(fileToServe);
    });

program
  .command("receive")
  .description("Receive files from mobile")
  .option("-i, --id <session-id>", "Session ID (default: random)")
  .action((opts) => {
    const sessionId = opts.id || crypto.randomBytes(4).toString("hex");
    startReceiver(sessionId);
  });


program.parse(process.argv);
