# TabulaX — Google Colab Model Runner

## How to Use

### Step 1: Open This Notebook in Google Colab
Upload this notebook to [Google Colab](https://colab.research.google.com) or copy the cells below.

### Step 2: Set Runtime to GPU
Go to **Runtime → Change runtime type → T4 GPU** → Save

### Step 3: Run All Cells
The notebook will:
1. Install dependencies
2. Mount Google Drive (to access your model)
3. Start a Flask API with ngrok tunnel
4. Print a **PUBLIC URL** — paste this into your `.env` file

---

## Cell 1: Install Dependencies

```python
!pip install flask pyngrok transformers peft torch accelerate -q
```

## Cell 2: Set Up ngrok Auth Token

Get your free token from [ngrok.com/signup](https://dashboard.ngrok.com/signup)

```python
# Replace with your ngrok auth token
!ngrok config add-authtoken YOUR_NGROK_TOKEN_HERE
```

## Cell 3: Upload Model to Colab

**Option A: Google Drive (recommended)**
```python
from google.colab import drive
drive.mount('/content/drive')

# Copy your fine-tuned model from Drive to Colab
# First, upload the tinyllama_cleaner_05 folder to your Google Drive
!cp -r "/content/drive/MyDrive/tinyllama_cleaner_05" /content/tinyllama_cleaner_05
```

**Option B: Direct upload**
```python
# Upload the tinyllama_cleaner_05 folder directly using Colab's file browser
# (left sidebar → folder icon → upload)
```

## Cell 4: Start the API Server

```python
import json
import re
import torch
from flask import Flask, request, jsonify
from pyngrok import ngrok
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModelForCausalLM

# ====== Load Model ======
MODEL_PATH = "/content/tinyllama_cleaner_05"  # Adjust if different
base_model_id = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(base_model_id)
tokenizer.pad_token = tokenizer.eos_token

print("Loading base model...")
base_model = AutoModelForCausalLM.from_pretrained(
    base_model_id, torch_dtype=torch.float16, device_map="auto"
)

print("Loading fine-tuned LoRA adapter...")
model = PeftModelForCausalLM.from_pretrained(
    base_model, MODEL_PATH, torch_dtype=torch.float16, device_map="auto"
)
model.eval()
print("✅ Model loaded on GPU!")

# ====== Flask API ======
app = Flask(__name__)

@app.route("/run-model", methods=["POST"])
def run_model():
    data = request.json
    input_rows = data.get("rows", [])
    results = []

    print(f"Received {len(input_rows)} rows to clean...")

    for i, row in enumerate(input_rows):
        prompt = f"""### Instruction:
Clean the following data row.

### Input:
{json.dumps(row)}

### Response:
"""
        inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
        with torch.no_grad():
            outputs = model.generate(**inputs, max_new_tokens=256)
        decoded = tokenizer.decode(outputs[0], skip_special_tokens=True)

        try:
            match = re.search(r"### Response:\s*(\{.*?\})", decoded, re.DOTALL)
            if match:
                json_out = json.loads(match.group(1))
                results.append(json_out)
                print(f"  [CLEANED] Row {i+1}/{len(input_rows)}")
            else:
                print(f"  [SKIP] No valid JSON in row {i+1}")
        except Exception as e:
            print(f"  [ERROR] Row {i+1}: {e}")

    return jsonify({"results": results})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "device": "cuda", "model": "TinyLlama"})

# ====== Start ngrok + Flask ======
public_url = ngrok.connect(5000)
print(f"\n{'='*50}")
print(f"🔗 COLAB URL: {public_url}")
print(f"{'='*50}")
print(f"\nPaste this into your .env file:")
print(f"COLAB_URL={public_url}")
print(f"\nThen restart your Node.js server!")
print(f"{'='*50}\n")

app.run(port=5000)
```

---

## Step 4: Update Your Local `.env`

After running Cell 4, you'll see something like:
```
🔗 COLAB URL: https://abc123.ngrok-free.app
```

Paste this into `tabulax-ui/server/.env`:
```
COLAB_URL=https://abc123.ngrok-free.app
```

Then restart your project with `npm start`.
