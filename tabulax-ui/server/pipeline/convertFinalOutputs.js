const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const { stringify } = require("csv-stringify/sync");
const PDFDocument = require("pdfkit");

// --- Paths ---
const BASE_DIR = path.resolve(__dirname, "..", "..", "..", "backend");
const CLEANED_CSV_FOLDER = path.join(BASE_DIR, "datasets", "cleaned_csv_files");
const FEATURES_JSON_FOLDER = path.join(BASE_DIR, "datasets", "feature_extracted_files");
const CONFIG_FILE = path.join(BASE_DIR, "integration_configs", "output_specifier_config.json");
const FINAL_CLEANED_FOLDER = path.join(BASE_DIR, "datasets", "final_cleaned_files");
const FINAL_FEATURE_FOLDER = path.join(BASE_DIR, "datasets", "final_feature_extracted_files");

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function clearFolder(folderPath) {
    if (!fs.existsSync(folderPath)) return;
    for (const file of fs.readdirSync(folderPath)) {
        fs.unlinkSync(path.join(folderPath, file));
    }
}

// --- Load config ---
function loadConfig() {
    if (!fs.existsSync(CONFIG_FILE)) {
        console.log("  No config file found. Using defaults.");
        return { format: "csv", featureEnabled: true };
    }
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    return {
        format: (data.output_format || "csv").toLowerCase(),
        featureEnabled: data.feature_extraction_enabled !== false,
    };
}

// --- PDF generation from rows ---
function writePdfFromRows(headers, rows, outputPath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ layout: "landscape", margin: 30, size: "A4" });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        doc.fontSize(8);
        const pageWidth = 780;
        const colWidth = headers.length > 0 ? pageWidth / headers.length : pageWidth;
        const rowHeight = 16;

        // Header row
        let x = 30;
        headers.forEach((h) => {
            doc.rect(x, doc.y, colWidth, rowHeight).stroke();
            doc.text(String(h).substring(0, 20), x + 2, doc.y + 3, { width: colWidth - 4, height: rowHeight });
            x += colWidth;
        });
        doc.moveDown(0.5);

        // Data rows
        for (const row of rows) {
            x = 30;
            const y = doc.y;
            if (y > 550) { doc.addPage(); }
            headers.forEach((h) => {
                doc.rect(x, doc.y, colWidth, rowHeight).stroke();
                doc.text(String(row[h] || "").substring(0, 30), x + 2, doc.y + 3, { width: colWidth - 4, height: rowHeight });
                x += colWidth;
            });
            doc.moveDown(0.2);
        }

        doc.end();
        stream.on("finish", resolve);
        stream.on("error", reject);
    });
}

// --- Read a CSV file into rows ---
function readCsvFile(csvPath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        let headers = [];
        fs.createReadStream(csvPath, { encoding: "utf-8" })
            .pipe(csvParser())
            .on("headers", (h) => { headers = h; })
            .on("data", (row) => rows.push(row))
            .on("end", () => resolve({ headers, rows }))
            .on("error", reject);
    });
}

// --- Convert cleaned CSV files ---
async function convertCleanedFiles(userFormat) {
    if (!fs.existsSync(CLEANED_CSV_FOLDER)) return;

    const csvFiles = fs.readdirSync(CLEANED_CSV_FOLDER).filter((f) => f.endsWith(".csv"));
    for (const file of csvFiles) {
        const filePath = path.join(CLEANED_CSV_FOLDER, file);
        const baseName = path.basename(file, ".csv");

        try {
            const { headers, rows } = await readCsvFile(filePath);

            if (userFormat === "json") {
                const jsonOut = path.join(FINAL_CLEANED_FOLDER, `${baseName}.json`);
                fs.writeFileSync(jsonOut, JSON.stringify(rows, null, 2), "utf-8");
            } else if (userFormat === "pdf") {
                const pdfOut = path.join(FINAL_CLEANED_FOLDER, `${baseName}.pdf`);
                await writePdfFromRows(headers, rows, pdfOut);
            } else {
                // CSV — just copy
                const csvOut = path.join(FINAL_CLEANED_FOLDER, file);
                fs.copyFileSync(filePath, csvOut);
            }
        } catch (err) {
            console.error(`  Error converting ${file}: ${err.message}`);
        }
    }
}

// --- Convert feature JSON files ---
async function convertFeatureFiles(userFormat) {
    if (!fs.existsSync(FEATURES_JSON_FOLDER)) return;

    const jsonFiles = fs.readdirSync(FEATURES_JSON_FOLDER).filter((f) => f.endsWith(".json"));
    for (const file of jsonFiles) {
        const filePath = path.join(FEATURES_JSON_FOLDER, file);
        const baseName = path.basename(file, ".json");

        try {
            const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

            // Flatten feature sections into rows
            const rows = [];
            for (const section of ["string", "numeric", "algorithm"]) {
                for (const row of (data.features?.[section] || [])) {
                    rows.push({ section, ...row });
                }
            }
            // Add general features
            const general = data.features?.general || {};
            for (const [colName, info] of Object.entries(general)) {
                rows.push({ section: "general", column: colName, ...info });
            }

            if (userFormat === "csv") {
                if (rows.length > 0) {
                    const headers = [...new Set(rows.flatMap(Object.keys))];
                    const csvContent = stringify(rows, { header: true, columns: headers });
                    fs.writeFileSync(path.join(FINAL_FEATURE_FOLDER, `${baseName}.csv`), csvContent, "utf-8");
                }
            } else if (userFormat === "pdf") {
                if (rows.length > 0) {
                    const headers = [...new Set(rows.flatMap(Object.keys))];
                    await writePdfFromRows(headers, rows, path.join(FINAL_FEATURE_FOLDER, `${baseName}.pdf`));
                }
            } else {
                // JSON — just copy
                fs.copyFileSync(filePath, path.join(FINAL_FEATURE_FOLDER, file));
            }
        } catch (err) {
            console.error(`  Error converting feature file ${file}: ${err.message}`);
        }
    }
}

// --- Main ---
async function convertFinalOutputs() {
    ensureDir(FINAL_CLEANED_FOLDER);
    ensureDir(FINAL_FEATURE_FOLDER);

    const { format, featureEnabled } = loadConfig();

    console.log(`\n  Converting cleaned files to ${format.toUpperCase()}...`);
    await convertCleanedFiles(format);

    if (featureEnabled) {
        console.log(`  Feature extraction is enabled — converting to ${format.toUpperCase()}...`);
        await convertFeatureFiles(format);
    } else {
        console.log("  Feature extraction is disabled. Skipping feature file conversion.");
    }

    console.log("  Cleaning temp folders...");
    clearFolder(CLEANED_CSV_FOLDER);
    clearFolder(FEATURES_JSON_FOLDER);

    console.log("  Final conversion complete.");
}

module.exports = convertFinalOutputs;
