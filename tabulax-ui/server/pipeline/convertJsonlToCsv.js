const fs = require("fs");
const path = require("path");
const { stringify } = require("csv-stringify/sync");

// --- Paths ---
const BASE_DIR = path.resolve(__dirname, "..", "..", "..", "backend");
const JSONL_FOLDER = path.join(BASE_DIR, "datasets", "jsonl_outputs");
const CSV_FOLDER = path.join(BASE_DIR, "datasets", "cleaned_csv_files");

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function convertJsonlToCsvFile(jsonlPath, csvPath) {
    try {
        const content = fs.readFileSync(jsonlPath, "utf-8");
        const lines = content
            .split("\n")
            .filter((l) => l.trim())
            .map((l) => JSON.parse(l));

        if (lines.length === 0) {
            console.log(`  No data in: ${path.basename(jsonlPath)}`);
            return;
        }

        const headers = Object.keys(lines[0]);
        const csvContent = stringify(lines, { header: true, columns: headers });
        fs.writeFileSync(csvPath, "\ufeff" + csvContent, "utf-8"); // BOM for Excel compat
        console.log(`  Converted: ${path.basename(jsonlPath)} → ${path.basename(csvPath)}`);
    } catch (err) {
        console.error(`  Failed to convert ${jsonlPath}: ${err.message}`);
    }
}

function convertAllJsonlToCsv() {
    ensureDir(CSV_FOLDER);

    if (!fs.existsSync(JSONL_FOLDER)) {
        console.log(`  JSONL folder not found: ${JSONL_FOLDER}`);
        return;
    }

    const jsonlFiles = fs.readdirSync(JSONL_FOLDER).filter((f) => f.endsWith(".jsonl"));
    if (jsonlFiles.length === 0) {
        console.log("  No .jsonl files found.");
        return;
    }

    for (const filename of jsonlFiles) {
        const jsonlPath = path.join(JSONL_FOLDER, filename);
        const csvName = path.basename(filename, ".jsonl") + ".csv";
        const csvPath = path.join(CSV_FOLDER, csvName);

        try {
            convertJsonlToCsvFile(jsonlPath, csvPath);
        } finally {
            try {
                fs.unlinkSync(jsonlPath);
                console.log(`  Deleted: ${filename}`);
            } catch (delErr) {
                console.error(`  Failed to delete ${filename}: ${delErr.message}`);
            }
        }
    }

    console.log("  All JSONL files processed and folder cleaned.");
}

module.exports = convertAllJsonlToCsv;
