const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");

// --- Paths ---
const BASE_DIR = path.resolve(__dirname, "..", "..", "..", "backend");
const INPUT_DIR = path.join(BASE_DIR, "datasets", "cleaned_csv_files");
const OUTPUT_DIR = path.join(BASE_DIR, "datasets", "feature_extracted_files");

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// --- Helpers ---
function mean(arr) {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function stdDev(arr) {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1));
}

function isNumericValue(val) {
    if (val === null || val === undefined || val === "") return false;
    return !isNaN(Number(val));
}

// --- Feature extraction ---
function extractFeatures(rows, headers) {
    const features = { string: [], numeric: [], algorithm: [], general: {} };

    for (const col of headers) {
        const values = rows.map((r) => r[col]).filter((v) => v !== null && v !== undefined && v !== "");

        // Determine if column is numeric
        const numericValues = values.filter(isNumericValue).map(Number);
        const isNumCol = numericValues.length > values.length * 0.5; // majority numeric

        // STRING FEATURES
        if (!isNumCol && values.length > 0) {
            const lengths = values.map((v) => String(v).length);
            const uniqueSet = new Set(values);
            features.string.push({
                column: col,
                avg_length: mean(lengths),
                min_length: Math.min(...lengths),
                max_length: Math.max(...lengths),
                unique_count: uniqueSet.size,
                sample_value: values[0] || null,
            });
        }

        // NUMERIC FEATURES
        if (isNumCol && numericValues.length > 0) {
            features.numeric.push({
                column: col,
                mean: mean(numericValues),
                min: Math.min(...numericValues),
                max: Math.max(...numericValues),
                std: stdDev(numericValues),
                non_zero_count: numericValues.filter((v) => v !== 0).length,
            });
        }

        // ALGORITHM FEATURES — pattern matching
        const patterns = {
            email: /^[\w.-]+@[\w.-]+\.\w+$/,
            phone: /^\+?\d[\d -]{7,}$/,
            zip: /^\d{5}(-\d{4})?$/,
            uuid: /^[0-9a-fA-F-]{32,36}$/,
        };

        const matchTypes = [];
        if (values.length > 0) {
            const sample = String(values[0]);
            for (const [name, pattern] of Object.entries(patterns)) {
                if (pattern.test(sample)) matchTypes.push(name);
            }
        }
        if (matchTypes.length > 0) {
            features.algorithm.push({ column: col, matches: matchTypes });
        }

        // GENERAL FEATURES
        const allValues = rows.map((r) => r[col]);
        const missingCount = allValues.filter((v) => v === null || v === undefined || v === "").length;
        features.general[col] = {
            dtype: isNumCol ? "number" : "string",
            missing_count: missingCount,
            unique_count: new Set(allValues).size,
            is_numeric: isNumCol,
        };
    }

    return features;
}

// --- Read CSV and extract ---
function processCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        let headers = [];
        fs.createReadStream(filePath, { encoding: "utf-8" })
            .pipe(csvParser())
            .on("headers", (h) => { headers = h; })
            .on("data", (row) => rows.push(row))
            .on("end", () => {
                if (rows.length === 0) {
                    console.log(`  ⚠️ Skipping empty file: ${path.basename(filePath)}`);
                    resolve(null);
                    return;
                }
                const features = extractFeatures(rows, headers);
                resolve({ file_name: path.basename(filePath), features });
            })
            .on("error", (err) => {
                console.error(`  ❌ Failed to read ${filePath}: ${err.message}`);
                resolve(null);
            });
    });
}

// --- Main ---
async function runFeatureExtraction() {
    ensureDir(OUTPUT_DIR);

    if (!fs.existsSync(INPUT_DIR)) {
        console.log(`  Input folder not found: ${INPUT_DIR}`);
        return;
    }

    const csvFiles = fs.readdirSync(INPUT_DIR).filter((f) => f.endsWith(".csv"));
    if (csvFiles.length === 0) {
        console.log("  No CSV files found.");
        return;
    }

    for (const filename of csvFiles) {
        const filePath = path.join(INPUT_DIR, filename);
        console.log(`  Processing: ${filename}`);

        const result = await processCsvFile(filePath);
        if (!result) continue;

        const outputPath = path.join(OUTPUT_DIR, filename.replace(".csv", "_features.json"));
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");
        console.log(`  Features saved: ${outputPath}`);
    }

    console.log("  Feature extraction complete.");
}

module.exports = runFeatureExtraction;
