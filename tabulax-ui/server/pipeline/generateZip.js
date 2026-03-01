const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

// --- Paths ---
const BASE_DIR = path.resolve(__dirname, "..", "..", "..", "backend");
const CLEANED_DIR = path.join(BASE_DIR, "datasets", "final_cleaned_files");
const FEATURE_DIR = path.join(BASE_DIR, "datasets", "final_feature_extracted_files");
const ZIP_FOLDER = path.join(BASE_DIR, "datasets", "zip_file");
const ZIP_PATH = path.join(ZIP_FOLDER, "final_output.zip");

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function clearFolder(folderPath) {
    if (!fs.existsSync(folderPath)) return;
    for (const item of fs.readdirSync(folderPath)) {
        const itemPath = path.join(folderPath, item);
        if (fs.statSync(itemPath).isDirectory()) {
            fs.rmSync(itemPath, { recursive: true, force: true });
        } else {
            fs.unlinkSync(itemPath);
        }
    }
}

function generateZip() {
    return new Promise((resolve, reject) => {
        ensureDir(ZIP_FOLDER);

        // Clear previous ZIP
        clearFolder(ZIP_FOLDER);

        const output = fs.createWriteStream(ZIP_PATH);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
            console.log(`  ZIP file created at: ${ZIP_PATH} (${archive.pointer()} bytes)`);

            // Clear final folders
            clearFolder(CLEANED_DIR);
            clearFolder(FEATURE_DIR);
            console.log("  Cleared final folders.");

            resolve(ZIP_PATH);
        });

        archive.on("error", (err) => reject(err));
        archive.pipe(output);

        // Add cleaned files
        if (fs.existsSync(CLEANED_DIR)) {
            const files = fs.readdirSync(CLEANED_DIR);
            for (const file of files) {
                archive.file(path.join(CLEANED_DIR, file), { name: `cleaned/${file}` });
            }
        }

        // Add feature-extracted files
        if (fs.existsSync(FEATURE_DIR)) {
            const files = fs.readdirSync(FEATURE_DIR);
            for (const file of files) {
                archive.file(path.join(FEATURE_DIR, file), { name: `features/${file}` });
            }
        }

        archive.finalize();
    });
}

module.exports = generateZip;
