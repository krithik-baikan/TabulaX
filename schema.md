# TabulaX — Schema Reference

All data schemas used in this project, covering MongoDB (Mongoose) models, API request/response shapes, pipeline config files, and JSONL data formats.

---

## 1. MongoDB Schemas (Mongoose)

### 1.1 User Schema
**Collection**: `users`  
**File**: `tabulax-ui/server/models/User.js`

```js
{
  uid:         String,   // required, unique — MongoDB ObjectId stringified
  email:       String,   // required, unique, lowercase, trimmed
  password:    String,   // required — bcrypt hashed (salt rounds: 10)
  firstName:   String,   // default: ""
  lastName:    String,   // default: ""
  dob:         String,   // format: "YYYY-MM-DD", default: ""
  phone:       String,   // default: ""
  countryCode: String,   // default: "+91"
  gender:      String,   // enum: ["Male", "Female", "Other", "Prefer not to say", ""], default: ""
  city:        String,   // default: ""
  state:       String,   // default: ""
  postcode:    String,   // default: ""
  country:     String,   // default: ""
  photo_url:   String,   // default: "" — profile picture URL
  isComplete:  Boolean,  // default: false — true when all required profile fields are filled
  createdAt:   Date,     // default: Date.now
  updatedAt:   Date,     // set on every save via pre-save hook
}
```

**Pre-save hook**: Hashes `password` with bcrypt whenever it is modified.  
**Instance method**: `comparePassword(candidatePassword)` — returns a Promise\<boolean\>.

**Profile completeness check** — `isComplete` is set to `true` when all of these fields are non-empty:

| Field | Required for completion |
|---|---|
| `firstName` | ✅ |
| `lastName` | ✅ |
| `email` | ✅ |
| `dob` | ✅ |
| `phone` | ✅ |
| `city` | ✅ |
| `state` | ✅ |
| `country` | ✅ |
| `photo_url` | ✅ |
| `gender` | ✅ |

---

### 1.2 File Schema
**Collection**: `files`  
**File**: `tabulax-ui/server/models/File.js`

```js
{
  originalName: String,   // original filename as uploaded
  fileType:     String,   // MIME type (e.g. "text/csv", "application/json")
  size:         Number,   // file size in bytes
  userEmail:    String,   // owner's email address (foreign key to User.email)
  uploadDate:   Date,     // default: Date.now
}
```

---

## 2. API Request / Response Schemas

### 2.1 Auth Routes

#### `POST /api/signup`
**Request body:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```
**Response `201`:**
```json
{
  "token": "<JWT string, expires in 7d>",
  "user": {
    "uid": "6640ab...",
    "email": "user@example.com",
    "firstName": "",
    "lastName": ""
  }
}
```
**Validation:**
- `email` and `password` are required
- `password` must be ≥ 6 characters
- Duplicate email returns `409`

---

#### `POST /api/login`
**Request body:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```
**Response `200`:**
```json
{
  "token": "<JWT string, expires in 7d>",
  "user": {
    "uid": "6640ab...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

#### `GET /api/me`
**Headers:** `Authorization: Bearer <token>`  
**Response `200`:** Full user object (password field excluded)

---

#### `POST /api/change-password`
**Headers:** `Authorization: Bearer <token>`  
**Request body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```
**Response `200`:**
```json
{ "message": "Password updated successfully" }
```

---

### 2.2 Profile Routes

#### `GET /api/get-profile/:uid`
**Response `200`:** Full user document or `null` if not found.

---

#### `POST /api/save-profile`
**Request body:**
```json
{
  "uid": "6640ab...",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "dob": "1995-06-15",
  "phone": "9876543210",
  "countryCode": "+91",
  "gender": "Male",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "postcode": "600001",
  "country": "India",
  "photo_url": "https://..."
}
```
**Response `200`:** Updated user document. `isComplete` is auto-computed on save.

---

### 2.3 File Routes

#### `POST /api/upload-files`
**Content-Type:** `multipart/form-data`  
**Form fields:**
- `files` — up to 5 files
- `userEmail` — owner's email (string)

**Response `200`:**
```json
{
  "message": "Files passed to MongoDB",
  "uploaded": [
    {
      "_id": "...",
      "originalName": "data.csv",
      "fileType": "text/csv",
      "size": 20480,
      "userEmail": "user@example.com",
      "uploadDate": "2026-05-10T17:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/get-user-files/:email`
**Response `200`:** Array of File documents sorted by `uploadDate` descending.

---

#### `GET /api/download-file/:name`
Streams the file from `server/uploads/<name>` to the client.

---

#### `DELETE /api/delete-file/:filename?userEmail=...`
**Response `200`:**
```json
{ "message": "File deleted" }
```

---

### 2.4 Pipeline Routes

#### `POST /start-integration`
**Request body:**
```json
{
  "outputFormats": ["csv"],
  "featureExtractionEnabled": true
}
```

| Field | Type | Default | Options |
|---|---|---|---|
| `outputFormats` | `string[]` | `["csv"]` | `"csv"`, `"json"`, `"pdf"` |
| `featureExtractionEnabled` | `boolean` | `true` | `true` / `false` |

**Response `200`:**
```json
{ "status": "completed" }
```

---

#### `GET /download/latest.zip`
Streams `backend/datasets/zip_file/final_output.zip` to the client.

---

#### `POST /force-reset`
Clears all pipeline working folders. No body required.  
**Response `200`:**
```json
{ "status": "reset" }
```

---

## 3. Pipeline Config Files

### 3.1 Integration Config
**Path**: `backend/integration_configs/output_specifier_config.json`  
Written by `pipelineRunner.js` before each run.

```json
{
  "output_format": "csv",
  "feature_extraction_enabled": true
}
```

| Field | Type | Description |
|---|---|---|
| `output_format` | `"csv"` \| `"json"` \| `"pdf"` | Desired format for final output files |
| `feature_extraction_enabled` | `boolean` | Whether to run Step 5 (feature extraction) |

---

### 3.2 Processing Time
**Path**: `backend/processing_time.txt`  
Written after each pipeline run. Contains a single integer — total seconds elapsed.

```
47
```

---

## 4. AI Model Data Formats

### 4.1 JSONL Input (per row)
**Folder**: `backend/datasets/jsonl_inputs/`  
Each line is one JSON object representing a single data row from the source CSV.

```jsonl
{"name": "john doe", "age": "twenty five", "city": "chennai"}
{"name": "JANE  DOE", "age": "30", "city": "  Mumbai"}
```

---

### 4.2 TinyLlama Prompt Template
Generated by `extractJsonlInputs.js` and consumed by `model_run.py`:

```
### Instruction:
Clean the following data row.

### Input:
{"name": "john doe", "age": "twenty five", "city": "chennai"}

### Response:
```

---

### 4.3 JSONL Output (cleaned row)
**Folder**: `backend/datasets/jsonl_outputs/`  
Each line is the cleaned JSON object extracted from the model response.

```jsonl
{"name": "John Doe", "age": "25", "city": "Chennai"}
{"name": "Jane Doe", "age": "30", "city": "Mumbai"}
```

---

## 5. Environment Variables

### Frontend — `tabulax-ui/.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL for the Node.js API (e.g. `http://localhost:4000`) |

---

### Server — `tabulax-ui/server/.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Express server port |
| `MONGO_URI` | — | MongoDB Atlas connection string |
| `JWT_SECRET` | `tabulax_jwt_secret_2026` | Secret used to sign/verify JWT tokens |
| `COLAB_URL` | `""` | ngrok URL of Colab inference server (leave empty to use local Python) |

---

## 6. Pipeline Folder Structure

```
backend/
├── datasets/
│   ├── converted_csv_files/        ← Step 1 output: all inputs as CSV
│   ├── cleaned_csv_files/          ← intermediate cleaned CSVs
│   ├── jsonl_inputs/               ← Step 2 output: JSONL prompts for model
│   ├── jsonl_outputs/              ← Step 3 output: cleaned JSONL from model
│   ├── feature_extracted_files/    ← Step 5 intermediate feature data
│   ├── final_feature_extracted_files/ ← Step 5 final feature-enriched files
│   ├── merged_outputs/             ← merged/combined output files
│   ├── final_cleaned_files/        ← Step 6 output: final format files
│   └── zip_file/
│       └── final_output.zip        ← Step 7 output: downloadable bundle
├── integration_configs/
│   └── output_specifier_config.json
├── processing_time.txt
├── model_run.py
└── tinyllama_cleaner_05/           ← LoRA fine-tuned adapter weights
```
