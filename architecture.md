# TabulaX — Project Architecture

> **TabulaX** is an AI-powered smart table integration platform that uses a fine-tuned TinyLlama model to clean, transform, and merge CSV/Excel/JSON/PDF data files. It features a React frontend, a Node.js/Express API server, a MongoDB database, and a Python-based AI inference engine that can run locally or remotely via Google Colab.

---

## High-Level Architecture

```mermaid
graph TD
    subgraph CLIENT["🖥️  Client Layer  —  React + Vite (port 3000)"]
        A1[HeroSection / Landing]
        A2[Login / Signup Pages]
        A3[Dashboard]
        A4[HomeTab — Upload & Integrate]
        A5[SettingsTab — Profile]
        A6[FilesUpload]
    end

    subgraph NODE_API["⚙️  Node.js / Express API Server (port 4000)"]
        B1[Auth Routes\n/api/signup\n/api/login\n/api/me]
        B2[Profile Routes\n/api/save-profile\n/api/get-profile]
        B3[File Routes\n/api/upload-files\n/api/get-user-files\n/api/delete-file\n/api/download-file]
        B4[Pipeline Routes\nPOST /start-integration\nGET /download/latest.zip\nPOST /force-reset]
    end

    subgraph MONGO["🗄️  MongoDB Atlas"]
        C1[(Users Collection)]
        C2[(Files Collection)]
    end

    subgraph PIPELINE["🔄  TabulaX Pipeline  —  Node.js Orchestrated"]
        P1[Step 1: convertAllToCsv\nCSV / XLSX / JSON / PDF → CSV]
        P2[Step 2: extractJsonlInputs\nCSV rows → JSONL prompt format]
        P3[Step 3: modelRun\nTinyLlama Inference]
        P4[Step 4: convertJsonlToCsv\nJSONL output → Cleaned CSV]
        P5[Step 5: featureExtraction\nOptional — Column analysis]
        P6[Step 6: convertFinalOutputs\nCSV / JSON / PDF output per config]
        P7[Step 7: generateZip\nBundle all outputs → final_output.zip]
    end

    subgraph AI["🤖  AI Inference Engine"]
        M1[Local Mode\nPython subprocess\nmodel_run.py\nTinyLlama-1.1B + LoRA PEFT\nCPU / GPU]
        M2[Remote Mode\nGoogle Colab + ngrok\nGPU-accelerated inference\nvia REST API]
    end

    subgraph FS["📁  File System  —  backend/datasets/"]
        F1[converted_csv_files/]
        F2[cleaned_csv_files/]
        F3[jsonl_inputs/]
        F4[jsonl_outputs/]
        F5[feature_extracted_files/]
        F6[final_feature_extracted_files/]
        F7[merged_outputs/]
        F8[final_cleaned_files/]
        F9[zip_file/final_output.zip]
    end

    subgraph CONFIG["⚙️  Config"]
        K1[integration_configs/\noutput_specifier_config.json\noutput_format + feature_extraction_enabled]
        K2[processing_time.txt]
    end

    %% Client → API
    A2 -->|JWT Auth| B1
    A5 -->|Save/Get Profile| B2
    A4 -->|Upload Files| B3
    A4 -->|Trigger Pipeline| B4
    A3 -->|File listing / download| B3

    %% API → MongoDB
    B1 <-->|Users CRUD| C1
    B2 <-->|Users CRUD| C1
    B3 <-->|Files CRUD| C2

    %% API → Pipeline
    B4 -->|runPipeline| PIPELINE

    %% Pipeline steps
    P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7

    %% Pipeline → File System
    P1 -->|writes| F1
    P2 -->|writes| F3
    P4 -->|writes| F4
    P5 -->|writes| F5
    P6 -->|writes| F8
    P7 -->|writes| F9

    %% Pipeline config
    B4 -->|writes config| K1
    P7 -->|writes time| K2

    %% Model step routes
    P3 -->|COLAB_URL set| M2
    P3 -->|COLAB_URL not set| M1

    %% Downloads
    B4 -->|GET /download/latest.zip| F9
```

---

## Component Breakdown

### 1. Frontend — `tabulax-ui/src/`
| Component | Route | Purpose |
|---|---|---|
| `HeroSection` | `/` | Landing page |
| `About` | `/about` | About page |
| `Support` | `/support` | Support/contact |
| `Login` | `/login` | JWT login form |
| `SignupPage` | `/signup` | User registration |
| `Dashboard` | `/dashboard` | Main app shell with sidebar |
| `HomeTab` | inside Dashboard | File upload + integration trigger |
| `SettingsTab` | inside Dashboard | Profile edit + password change |
| `FilesUpload` | inside Dashboard | View/download/delete uploaded files |
| `Navbar` | global | Top navigation bar |
| `Sidebar` | inside Dashboard | Dashboard side navigation |
| `LogoutModal` | inside Dashboard | Logout confirmation dialog |

### 2. API Server — `tabulax-ui/server/index.js`
- **Runtime**: Node.js + Express (port 4000)
- **Auth**: JWT (jsonwebtoken), password hashing via bcryptjs
- **File Uploads**: Multer (disk storage → `server/uploads/`)
- **Database**: Mongoose → MongoDB Atlas

### 3. Pipeline — `tabulax-ui/server/pipeline/`
| File | Role |
|---|---|
| `pipelineRunner.js` | Orchestrator — runs all 7 steps in sequence |
| `convertAllToCsv.js` | Converts CSV/XLSX/JSON/PDF inputs to CSV |
| `extractJsonlInputs.js` | Converts CSV rows to `.jsonl` prompt format |
| `modelRun.js` | Runs TinyLlama (Colab or local subprocess) |
| `convertJsonlToCsv.js` | Parses model output JSONL → CSV |
| `featureExtraction.js` | Optional: extracts/enriches column features |
| `convertFinalOutputs.js` | Converts cleaned data to the requested output format |
| `generateZip.js` | Zips all output files for download |

### 4. AI Engine — `backend/`
| Component | Description |
|---|---|
| `model_run.py` | Python script: loads TinyLlama-1.1B-Chat + LoRA (PEFT), runs inference on `.jsonl` files |
| `tinyllama_cleaner_05/` | Fine-tuned LoRA adapter weights |
| `datasets/` | Pipeline working directory (inputs/outputs per step) |
| `integration_configs/` | JSON config written before each pipeline run |

### 5. Data Flow

```
User uploads files
        │
        ▼
Multer saves to server/uploads/
        │
        ▼
User clicks "Start Integration"
        │
        ▼
POST /start-integration
        │
   pipelineRunner.js
        │
  ┌─────┴───────────────────────────────────┐
  │  Step 1: Any format → CSV               │
  │  Step 2: CSV rows → JSONL prompts       │
  │  Step 3: TinyLlama cleans each row      │  ◄── Colab GPU or local Python
  │  Step 4: JSONL results → CSV            │
  │  Step 5: Feature extraction (optional)  │
  │  Step 6: Final format conversion        │
  │  Step 7: ZIP all outputs                │
  └─────────────────────────────────────────┘
        │
        ▼
GET /download/latest.zip
        │
        ▼
User downloads cleaned, merged dataset
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Tailwind CSS |
| API Server | Node.js, Express 4, Multer, JWT, bcryptjs |
| Database | MongoDB Atlas via Mongoose |
| AI Model | TinyLlama-1.1B-Chat-v1.0 + LoRA PEFT (Python, PyTorch, Transformers) |
| Remote GPU | Google Colab + ngrok tunnel |
| Concurrency | `concurrently` npm package (runs frontend + server together) |

---

## Port Map

| Service | Port |
|---|---|
| React Frontend (Vite) | `3000` |
| Node.js API Server | `4000` |
| Google Colab (ngrok, optional) | dynamic (env: `COLAB_URL`) |
