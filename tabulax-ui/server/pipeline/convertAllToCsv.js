const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const { stringify } = require("csv-stringify/sync");
const pdfParse = require("pdf-parse");

// --- Paths ---
const BASE_DIR = path.resolve(__dirname, "..", "..", "..", "backend");
const UPLOADS_DIR = path.resolve(__dirname, "..", "uploads");
const OUTPUT_DIR = path.join(BASE_DIR, "datasets", "converted_csv_files");

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// --- CSV passthrough ---
function convertCsvFile(inputPath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        let headers = null;
        fs.createReadStream(inputPath, { encoding: "utf-8" })
            .pipe(csvParser())
            .on("headers", (h) => { headers = h; })
            .on("data", (row) => rows.push(row))
            .on("end", () => resolve({ headers, rows }))
            .on("error", reject);
    });
}

// --- JSON → CSV ---
function convertJsonFile(inputPath) {
    const raw = fs.readFileSync(inputPath, "utf-8");
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : [data];
    if (arr.length === 0) return null;
    const headers = Object.keys(arr[0]);
    return { headers, rows: arr };
}

// --- PDF → CSV ---
async function convertPdfFile(inputPath) {
    const buffer = fs.readFileSync(inputPath);
    const pdf = await pdfParse(buffer);
    const text = pdf.text;
    if (!text || !text.trim()) {
        console.log(`  No extractable text in PDF: ${inputPath}`);
        return null;
    }
    const lines = text
        .trim()
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => l.trim().split(/\s+/));

    if (lines.length === 0) return null;
    // Use first row as header indices
    const maxCols = Math.max(...lines.map((l) => l.length));
    const headers = Array.from({ length: maxCols }, (_, i) => String(i));
    const rows = lines.map((line) => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = line[i] || ""; });
        return obj;
    });
    return { headers, rows };
}

// --- Main ---
async function convertAllToCsv() {
    ensureDir(OUTPUT_DIR);

    if (!fs.existsSync(UPLOADS_DIR)) {
        console.log(`  Upload folder not found: ${UPLOADS_DIR}`);
        return;
    }

    const files = fs.readdirSync(UPLOADS_DIR);
    if (files.length === 0) {
        console.log("  No files to process in uploads directory.");
        return;
    }

    for (const filename of files) {
        const sourcePath = path.join(UPLOADS_DIR, filename);
        if (!fs.statSync(sourcePath).isFile()) continue;

        const ext = path.extname(filename).toLowerCase();
        const baseName = path.basename(filename, ext);
        const outputPath = path.join(OUTPUT_DIR, `${baseName}.csv`);

        let result = null;
        try {
            if (ext === ".csv") {
                result = await convertCsvFile(sourcePath);
            } else if (ext === ".json") {
                result = convertJsonFile(sourcePath);
            } else if (ext === ".pdf") {
                result = await convertPdfFile(sourcePath);
            } else {
                console.log(`[SKIPPED] Unsupported file format: ${filename}`);
                continue;
            }

            if (!result || !result.rows || result.rows.length === 0) {
                console.log(`  Extracted data is empty for: ${filename}`);
                continue;
            }

            // Write CSV
            const csvContent = stringify(result.rows, { header: true, columns: result.headers });
            fs.writeFileSync(outputPath, csvContent, "utf-8");
            console.log(`[OK] Converted to CSV: ${baseName}.csv`);

            // Delete source upload
            fs.unlinkSync(sourcePath);
            console.log(`[CLEANED] Deleted upload: ${filename}`);
        } catch (err) {
            console.error(`[ERROR] Failed to convert ${filename}: ${err.message}`);
        }
    }
}

module.exports = convertAllToCsv;
