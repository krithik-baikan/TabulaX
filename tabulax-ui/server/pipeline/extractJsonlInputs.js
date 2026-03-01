const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");

// --- Paths ---
const BASE_DIR = path.resolve(__dirname, "..", "..", "..", "backend");
const CSV_INPUT_FOLDER = path.join(BASE_DIR, "datasets", "converted_csv_files");
const JSONL_OUTPUT_FOLDER = path.join(BASE_DIR, "datasets", "jsonl_inputs");

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function convertCsvToJsonl(csvPath, jsonlPath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(csvPath, { encoding: "utf-8" })
            .pipe(csvParser())
            .on("data", (row) => {
                // Normalize column names to lowercase
                const normalized = {};
                for (const key of Object.keys(row)) {
                    normalized[key.trim().toLowerCase()] = row[key];
                }
                rows.push(normalized);
            })
            .on("end", () => {
                const lines = rows.map((r, i) => {
                    console.log(`[INFO] Wrote row ${i + 1} to ${path.basename(jsonlPath)}`);
                    return JSON.stringify(r);
                });
                fs.writeFileSync(jsonlPath, lines.join("\n") + "\n", "utf-8");
                console.log(`[SUCCESS] Converted ${rows.length} rows to ${path.basename(jsonlPath)}`);
                resolve(true);
            })
            .on("error", (err) => {
                console.error(`[ERROR] Failed to process ${csvPath}: ${err.message}`);
                resolve(false);
            });
    });
}

async function extractJsonlInputs() {
    ensureDir(JSONL_OUTPUT_FOLDER);

    if (!fs.existsSync(CSV_INPUT_FOLDER)) {
        console.log(`  Input folder not found: ${CSV_INPUT_FOLDER}`);
        return;
    }

    const csvFiles = fs.readdirSync(CSV_INPUT_FOLDER).filter((f) => f.endsWith(".csv"));
    if (csvFiles.length === 0) {
        console.log("  No CSV files found.");
        return;
    }

    for (const filename of csvFiles) {
        const csvPath = path.join(CSV_INPUT_FOLDER, filename);
        const jsonlName = path.basename(filename, ".csv") + ".jsonl";
        const jsonlPath = path.join(JSONL_OUTPUT_FOLDER, jsonlName);

        const success = await convertCsvToJsonl(csvPath, jsonlPath);
        if (success) {
            fs.unlinkSync(csvPath);
            console.log(`[CLEANUP] Deleted processed CSV: ${filename}`);
        }
    }
}

module.exports = extractJsonlInputs;
