import os
import json
import re
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModelForCausalLM

# ====== Auto-detect GPU/CPU ======
device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32

print(f" Using Device: {device.upper()}")
if device == "cuda":
    print(f" GPU: {torch.cuda.get_device_name(0)}")
else:
    print(" No GPU found — running on CPU (slower but works)")

# ====== Paths ======
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FOLDER = os.path.join(BASE_DIR, "datasets", "jsonl_inputs")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "datasets", "jsonl_outputs")
MODEL_PATH = os.path.join(BASE_DIR, "tinyllama_cleaner_05")

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# ====== Check inputs exist ======
if not os.path.exists(INPUT_FOLDER) or not os.listdir(INPUT_FOLDER):
    print(" No JSONL input files found. Skipping model run.")
    exit(0)

jsonl_files = [f for f in os.listdir(INPUT_FOLDER) if f.endswith(".jsonl")]
if not jsonl_files:
    print(" No .jsonl files found. Skipping model run.")
    exit(0)

print(f" Found {len(jsonl_files)} JSONL file(s) to process.")

# ====== Load Model ======
print(" Loading TinyLlama model (this may take a few minutes on CPU)...")
base_model_id = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
tokenizer = AutoTokenizer.from_pretrained(base_model_id)
tokenizer.pad_token = tokenizer.eos_token

if device == "cuda":
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_id, torch_dtype=dtype, device_map="auto"
    )
    model = PeftModelForCausalLM.from_pretrained(
        base_model, MODEL_PATH, torch_dtype=dtype, device_map="auto"
    )
else:
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_id, torch_dtype=dtype
    )
    base_model = base_model.to("cpu")
    model = PeftModelForCausalLM.from_pretrained(
        base_model, MODEL_PATH
    )
    model = model.to("cpu")

model.eval()
print(" Model loaded successfully!")

try:
    # ====== Process All JSONL Inputs ======
    for filename in jsonl_files:
        input_path = os.path.join(INPUT_FOLDER, filename)
        output_path = os.path.join(OUTPUT_FOLDER, filename)

        with open(input_path, "r", encoding="utf-8") as infile:
            jsonl_data = [json.loads(line) for line in infile]

        print(f" Processing {filename} ({len(jsonl_data)} rows)...")
        cleaned_rows = []

        for i, row in enumerate(jsonl_data):
            prompt = f"""### Instruction:
Clean the following data row.

### Input:
{json.dumps(row)}

### Response:
"""
            inputs = tokenizer(prompt, return_tensors="pt").to(device)
            with torch.no_grad():
                outputs = model.generate(**inputs, max_new_tokens=256)
            decoded = tokenizer.decode(outputs[0], skip_special_tokens=True)

            try:
                match = re.search(r"### Response:\s*(\{.*?\})", decoded, re.DOTALL)
                if match:
                    json_out = json.loads(match.group(1))
                    cleaned_rows.append(json_out)
                    print(f"[CLEANED] Row {i+1}/{len(jsonl_data)} from {filename}")
                else:
                    print(f"[SKIP] No valid JSON in row {i+1} of {filename}")
            except Exception as e:
                print(f"[ERROR] Failed to parse row {i+1} in {filename}: {e}")

        # ====== Save Output ======
        with open(output_path, "w", encoding="utf-8") as out_file:
            for record in cleaned_rows:
                out_file.write(json.dumps(record, ensure_ascii=False) + "\n")

        print(f"[SAVED] {len(cleaned_rows)} cleaned rows to {output_path}")

        # ====== Delete Input File After Processing ======
        os.remove(input_path)
        print(f"[CLEANUP] Removed processed input file: {filename}")

finally:
    if device == "cuda":
        print(" Cleaning up CUDA memory...")
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()
    else:
        print(" Processing complete (CPU mode)")
