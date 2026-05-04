# 🧠 TabulaX — Smart Table Integration

LLM-Orchestrated Data Processing and Feature Engineering Platform built with **React**, **Node.js/Express**, and a **fine-tuned TinyLlama model**. Upload messy CSV/JSON/PDF files and get cleaned, structured data with extracted features.

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  React Frontend │────▶│  Node.js/Express API │────▶│  TinyLlama Model    │
│  (Port 3000)    │     │  (Port 4000)         │     │  (Python/Colab GPU) │
│  Vite + Tailwind│     │  JWT Auth + MongoDB  │     │  LoRA Fine-tuned    │
└─────────────────┘     └──────────────────────┘     └─────────────────────┘
```

## ✨ Features

- **JWT Authentication** — Signup/Login with bcrypt password hashing & JWT tokens
- **File Upload** — Upload CSV, JSON, and PDF files (max 25MB each)
- **AI Data Cleaning** — Fine-tuned TinyLlama 1.1B model cleans messy data rows
- **Feature Extraction** — Extracts string, numeric, and algorithmic features
- **Multi-Format Output** — Export results as CSV, JSON, or PDF
- **ZIP Download** — Download all cleaned files and features in a single ZIP
- **Google Colab Support** — Run model inference on free GPU via Colab + ngrok

## 📁 Project Structure

```
Smart_Table_Integration/
├── package.json              # Root: runs frontend + API concurrently
├── COLAB_SETUP.md            # Guide to run model on Google Colab
│
├── backend/
│   ├── model_run.py          # TinyLlama inference script (GPU/CPU)
│   └── tinyllama_cleaner_05/ # Fine-tuned LoRA adapter (not in repo)
│
└── tabulax-ui/
    ├── src/                  # React frontend
    │   └── components/
    │       ├── Login.jsx         # JWT login
    │       ├── SignupPage.jsx    # JWT signup
    │       ├── Dashboard.jsx     # Main dashboard
    │       ├── HomeTab.jsx       # File upload + integration
    │       ├── SettingsTab.jsx   # Profile + password management
    │       ├── Sidebar.jsx       # Navigation sidebar
    │       └── FilesUpload.jsx   # Uploaded files view
    │
    └── server/               # Express API
        ├── index.js              # Routes: auth, profile, pipeline
        ├── models/User.js        # Mongoose User model (bcrypt)
        ├── models/File.js        # Mongoose File model
        └── pipeline/
            ├── pipelineRunner.js     # Orchestrates all 7 steps
            ├── convertAllToCsv.js    # Step 1: CSV/JSON/PDF → CSV
            ├── extractJsonlInputs.js # Step 2: CSV → JSONL
            ├── modelRun.js           # Step 3: Colab API or local Python
            ├── convertJsonlToCsv.js  # Step 4: JSONL → CSV
            ├── featureExtraction.js  # Step 5: Feature extraction
            ├── convertFinalOutputs.js# Step 6: Format conversion
            └── generateZip.js        # Step 7: ZIP packaging
```

## 🛠️ Tech Stack

| Layer     | Technology                                      |
|-----------|--------------------------------------------------|
| Frontend  | React 18, Vite 6, TailwindCSS 3, React Router 6 |
| Backend   | Node.js, Express 5, Mongoose, JWT, bcrypt        |
| Database  | MongoDB Atlas                                    |
| ML Model  | TinyLlama 1.1B + LoRA (PyTorch, Transformers)   |
| Pipeline  | csv-parser, pdf-parse, pdfkit, archiver          |

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Python** 3.9+ (with `torch`, `transformers`, `peft`)
- **MongoDB Atlas** account (free tier works)
- **ngrok** account (free, for Colab integration)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/Smart_Table_Integration.git
cd Smart_Table_Integration

# Install root dependencies
npm install

# Install frontend dependencies
cd tabulax-ui && npm install

# Install server dependencies
cd server && npm install
cd ../..
```

### 2. Configure Environment

Create `tabulax-ui/server/.env`:
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?appName=Cluster0
COLAB_URL=
```

Create `tabulax-ui/.env`:
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?appName=Cluster0
```

### 3. Download Model Weights

The fine-tuned TinyLlama LoRA adapter is not included in the repo (too large).

1. Download the `tinyllama_cleaner_05/` folder from [Google Drive link]
2. Place it in `backend/tinyllama_cleaner_05/`

### 4. Run the Project

```bash
npm start
```

This starts:
- **Frontend** → http://localhost:3000
- **API Server** → http://localhost:4000

### 5. (Optional) Set Up Google Colab for GPU Inference

For fast model inference, follow the guide in [`COLAB_SETUP.md`](./COLAB_SETUP.md).

After starting the Colab notebook, paste the ngrok URL into `tabulax-ui/server/.env`:
```env
COLAB_URL=https://your-ngrok-url.ngrok-free.app
```

Then restart with `npm start`.

## 📡 API Routes

### Authentication
| Method | Route                | Description          |
|--------|----------------------|----------------------|
| POST   | `/api/signup`        | Create account       |
| POST   | `/api/login`         | Login, returns JWT   |
| GET    | `/api/me`            | Get current user     |
| POST   | `/api/change-password` | Update password    |

### Profile
| Method | Route                      | Description       |
|--------|----------------------------|-------------------|
| GET    | `/api/get-profile/:uid`    | Get user profile  |
| POST   | `/api/save-profile`        | Save/update profile |

### Pipeline
| Method | Route                  | Description              |
|--------|------------------------|--------------------------|
| POST   | `/api/upload-files`    | Upload CSV/JSON/PDF files |
| POST   | `/start-integration`   | Run the 7-step pipeline  |
| GET    | `/download/latest.zip` | Download results ZIP     |
| POST   | `/force-reset`         | Clear all pipeline data  |

## 🔄 Pipeline Steps

1. **Convert to CSV** — Normalize uploaded files to CSV format
2. **Extract JSONL** — Convert CSV rows to JSONL for model input
3. **TinyLlama Inference** — AI cleans each data row (Colab GPU or local CPU)
4. **JSONL to CSV** — Convert cleaned outputs back to CSV
5. **Feature Extraction** — Extract string, numeric, and algorithmic features
6. **Format Conversion** — Convert to user's chosen format (CSV/JSON/PDF)
7. **ZIP Packaging** — Bundle all outputs into a downloadable ZIP

## 📄 License

MIT
