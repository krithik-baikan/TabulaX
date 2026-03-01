const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const MODEL_SCRIPT = path.resolve(__dirname, "..", "..", "..", "backend", "model_run.py");
const BASE_DIR = path.resolve(__dirname, "..", "..", "..", "backend");
const INPUT_FOLDER = path.join(BASE_DIR, "datasets", "jsonl_inputs");
const OUTPUT_FOLDER = path.join(BASE_DIR, "datasets", "jsonl_outputs");

// Read Colab URL from environment variable
const COLAB_URL = process.env.COLAB_URL || "";

/**
 * Run model via Google Colab API (remote GPU).
 * Sends JSONL rows to Colab, receives cleaned results.
 */
async function runModelViaColab() {
    if (!COLAB_URL) {
        throw new Error("COLAB_URL not set in .env — start the Colab notebook and paste the ngrok URL");
    }

    console.log(`  Using Colab API: ${COLAB_URL}`);

    if (!fs.existsSync(INPUT_FOLDER)) {
        console.log("  No JSONL input folder found. Skipping model run.");
        return;
    }

    const files = fs.readdirSync(INPUT_FOLDER).filter(f => f.endsWith(".jsonl"));
    if (files.length === 0) {
        console.log("  No JSONL files to process. Skipping.");
        return;
    }

    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
    }

    for (const filename of files) {
        const inputPath = path.join(INPUT_FOLDER, filename);
        const outputPath = path.join(OUTPUT_FOLDER, filename);

        const rawLines = fs.readFileSync(inputPath, "utf-8").trim().split("\n");
        const rows = rawLines.map(line => JSON.parse(line));

        console.log(`  Sending ${rows.length} rows from ${filename} to Colab...`);

        try {
            const response = await axios.post(`${COLAB_URL}/run-model`, {
                rows: rows,
            }, {
                timeout: 600000, // 10 min timeout per file
                headers: { "Content-Type": "application/json" },
            });

            const results = response.data.results || [];
            console.log(`  Received ${results.length} cleaned rows from Colab.`);

            // Write cleaned output
            const outLines = results.map(r => {
                if (typeof r === "string") {
                    try { return JSON.stringify(JSON.parse(r)); } catch { return null; }
                }
                return JSON.stringify(r);
            }).filter(Boolean);

            fs.writeFileSync(outputPath, outLines.join("\n") + "\n", "utf-8");
            console.log(`  [SAVED] ${outLines.length} rows to ${outputPath}`);

            // Delete processed input
            fs.unlinkSync(inputPath);
            console.log(`  [CLEANUP] Removed: ${filename}`);
        } catch (err) {
            console.error(`  [ERROR] Colab API call failed for ${filename}: ${err.message}`);
            throw err;
        }
    }
}

/**
 * Run model locally via Python subprocess (CPU/GPU fallback).
 */
function runModelLocal() {
    return new Promise((resolve, reject) => {
        console.log(`  Spawning Python model script: ${MODEL_SCRIPT}`);

        const proc = spawn("python", [MODEL_SCRIPT], {
            cwd: path.dirname(MODEL_SCRIPT),
            stdio: ["ignore", "pipe", "pipe"],
        });

        proc.stdout.on("data", (data) => {
            process.stdout.write(`[MODEL] ${data}`);
        });

        proc.stderr.on("data", (data) => {
            process.stderr.write(`[MODEL-ERR] ${data}`);
        });

        proc.on("close", (code) => {
            if (code === 0) {
                console.log("  Model inference completed successfully.");
                resolve();
            } else {
                reject(new Error(`Model script exited with code ${code}`));
            }
        });

        proc.on("error", (err) => {
            reject(new Error(`Failed to spawn model script: ${err.message}`));
        });
    });
}

/**
 * Main entry: Use Colab if URL is set, otherwise fall back to local.
 */
async function runModel() {
    if (COLAB_URL) {
        console.log("  Mode: Google Colab (Remote GPU)");
        return await runModelViaColab();
    } else {
        console.log("  Mode: Local (CPU/GPU)");
        return await runModelLocal();
    }
}

module.exports = runModel;
