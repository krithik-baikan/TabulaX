const fs = require("fs");
const path = require("path");
const convertAllToCsv = require("./convertAllToCsv");
const extractJsonlInputs = require("./extractJsonlInputs");
const runModel = require("./modelRun");
const convertJsonlToCsv = require("./convertJsonlToCsv");
const runFeatureExtraction = require("./featureExtraction");
const convertFinalOutputs = require("./convertFinalOutputs");
const generateZip = require("./generateZip");

const BASE_DIR = path.resolve(__dirname, "..", "..", "..", "backend");
const CONFIG_DIR = path.join(BASE_DIR, "integration_configs");
const TIME_FILE = path.join(BASE_DIR, "processing_time.txt");

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Run the full TabulaX pipeline.
 * @param {string} selectedFormat - Output format: "csv", "json", or "pdf"
 * @param {boolean} featureEnabled - Whether to run feature extraction
 */
async function runPipeline(selectedFormat = "csv", featureEnabled = true) {
    console.log("\n==============================");
    console.log("   Starting TabulaX Pipeline");
    console.log("==============================\n");

    const startTime = Date.now();

    // Step 0: Write config
    ensureDir(CONFIG_DIR);
    const configPath = path.join(CONFIG_DIR, "output_specifier_config.json");
    fs.writeFileSync(configPath, JSON.stringify({
        output_format: selectedFormat,
        feature_extraction_enabled: featureEnabled,
    }, null, 2), "utf-8");
    console.log("  Saved integration config. Starting pipeline...\n");

    const steps = [
        { name: "STEP 1: Convert all files to CSV", fn: convertAllToCsv },
        { name: "STEP 2: Extract JSONL inputs from CSV", fn: extractJsonlInputs },
        { name: "STEP 3: Run TinyLlama model on JSONL inputs", fn: runModel },
        { name: "STEP 4: Convert JSONL outputs to CSV", fn: convertJsonlToCsv },
        { name: "STEP 5: Run feature extraction", fn: runFeatureExtraction, optional: true },
        { name: "STEP 6: Convert final outputs as per config", fn: convertFinalOutputs },
        { name: "STEP 7: Generate ZIP file", fn: generateZip },
    ];

    for (const step of steps) {
        // Skip optional feature extraction if disabled
        if (step.optional && !featureEnabled) {
            console.log(`  Skipping: ${step.name} (Feature extraction disabled)`);
            continue;
        }

        console.log("\n====================================");
        console.log(step.name);
        console.log("====================================");

        const stepStart = Date.now();
        try {
            await step.fn();
        } catch (err) {
            console.error(`  Error in: ${step.name}. ${err.message}`);
            throw err;
        }

        const stepTime = ((Date.now() - stepStart) / 1000).toFixed(2);
        console.log(`  Completed in ${stepTime} sec`);
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    fs.writeFileSync(TIME_FILE, String(totalTime), "utf-8");

    console.log(`\n  TabulaX Pipeline finished in ${totalTime} seconds.`);
}

module.exports = runPipeline;
