#!/usr/bin/env python3
import os
import sys
import csv
import json
import argparse
from datetime import datetime

# Define standard headers for our internal system
SCHEMA_FACILITIES = ["id", "name", "type", "latitude", "longitude", "contact"]
SCHEMA_INVENTORY = ["name", "quantity", "unit", "minimumThreshold", "lastUpdated"]
SCHEMA_DISEASES = ["id", "title", "title_lg", "icon", "color", "steps_json", "steps_lg_json"]

# Semantic mappings to auto-detect Kaggle/HDX headers
MAPPINGS = {
    "facilities": {
        "name": ["facility", "clinic", "hospital", "name", "facility_name", "hosp_name", "title"],
        "type": ["type", "level", "tier", "facility_type", "class", "category"],
        "latitude": ["latitude", "lat", "y", "coord_lat", "latitude_deg"],
        "longitude": ["longitude", "long", "lon", "x", "coord_long", "longitude_deg"],
        "contact": ["contact", "phone", "telephone", "mobile", "email", "address"]
    },
    "inventory": {
        "name": ["name", "medicine", "drug", "item", "product", "description"],
        "quantity": ["quantity", "qty", "stock", "count", "amount"],
        "unit": ["unit", "pack", "form", "dosage_form"],
        "minimumThreshold": ["minimumthreshold", "min_stock", "threshold", "min_qty", "alert_level"],
        "lastUpdated": ["lastupdated", "updated", "date", "timestamp"]
    },
    "diseases": {
        "id": ["id", "code", "disease_id"],
        "title": ["title", "name", "disease", "ailment", "condition"],
        "title_lg": ["title_lg", "luganda", "local_name", "title_local"],
        "icon": ["icon", "symbol", "image"],
        "color": ["color", "hex", "theme"],
        "steps_json": ["steps_json", "steps", "treatment", "guidelines", "protocol"],
        "steps_lg_json": ["steps_lg_json", "steps_lg", "treatment_lg", "guidelines_lg"]
    }
}

def clean_value(val):
    return val.strip() if val else ""

def auto_detect_mapping(headers, category):
    detected = {}
    category_mappings = MAPPINGS[category]
    
    for target_col, synonyms in category_mappings.items():
        found = False
        for syn in synonyms:
            for h in headers:
                if syn.lower() == h.strip().lower() or syn.lower() in h.strip().lower().replace(" ", "_"):
                    detected[target_col] = h
                    found = True
                    break
            if found:
                break
    return detected

def prompt_manual_mapping(headers, category, auto_mapped):
    print(f"\n--- Column Mapping Configuration for [{category.upper()}] ---")
    print("Detected columns in raw CSV:")
    for idx, h in enumerate(headers):
        print(f"  [{idx}] {h}")
    print("\nWe need to map these to our database schema. Press Enter to accept auto-detection.")
    
    final_mapping = {}
    target_schema = SCHEMA_FACILITIES if category == "facilities" else (SCHEMA_INVENTORY if category == "inventory" else SCHEMA_DISEASES)
    
    for target in target_schema:
        # Don't strictly require 'id' or fields that can be auto-generated or left blank
        default_val = auto_mapped.get(target, "")
        default_prompt = f" (Auto-detected: '{default_val}')" if default_val else ""
        
        while True:
            choice = input(f"Select source column for '{target}'{default_prompt} [Enter Index or Column Name, or 'skip']: ").strip()
            
            if choice == "":
                if default_val:
                    final_mapping[target] = default_val
                    break
                elif target in ["contact", "title_lg", "steps_lg_json", "id", "icon", "color"]:
                    print(f"Skipping optional field '{target}'")
                    final_mapping[target] = None
                    break
                else:
                    print(f"Error: Field '{target}' is required. Please map it.")
            elif choice.lower() == "skip":
                final_mapping[target] = None
                break
            else:
                # Check if index
                try:
                    idx = int(choice)
                    if 0 <= idx < len(headers):
                        final_mapping[target] = headers[idx]
                        break
                    else:
                        print("Invalid index. Try again.")
                except ValueError:
                    # Check if exact match
                    matching_headers = [h for h in headers if h.lower() == choice.lower()]
                    if matching_headers:
                        final_mapping[target] = matching_headers[0]
                        break
                    else:
                        print(f"Header '{choice}' not found in raw CSV. Try again.")
                        
    return final_mapping

def import_csv(input_path, category, append_to_existing=True):
    if not os.path.exists(input_path):
        print(f"Error: Input CSV file '{input_path}' not found.")
        sys.exit(1)
        
    db_file_map = {
        "facilities": "../src/db/uganda_facilities.csv",
        "inventory": "../src/db/uganda_inventory.csv",
        "diseases": "../src/db/uganda_diseases.csv"
    }
    
    # Resolve correct paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target_db_path = os.path.join(script_dir, db_file_map[category])
    
    print(f"Reading raw Kaggle/HDX dataset from: {input_path}")
    
    with open(input_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            print("Error: Input CSV is empty.")
            sys.exit(1)
            
    auto_mapped = auto_detect_mapping(headers, category)
    mapping = prompt_manual_mapping(headers, category, auto_mapped)
    
    raw_records = []
    with open(input_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_records.append(row)
            
    new_records = []
    
    # Process and map records
    for i, raw in enumerate(raw_records):
        new_row = {}
        
        if category == "facilities":
            new_row["id"] = raw.get(mapping["id"]) if mapping.get("id") else (i + 1)
            new_row["name"] = clean_value(raw.get(mapping["name"])) if mapping.get("name") else f"Facility {i+1}"
            new_row["type"] = clean_value(raw.get(mapping["type"])) if mapping.get("type") else "Health Center"
            
            lat_val = raw.get(mapping["latitude"]) if mapping.get("latitude") else "0.0"
            lng_val = raw.get(mapping["longitude"]) if mapping.get("longitude") else "0.0"
            try:
                new_row["latitude"] = float(lat_val)
            except (ValueError, TypeError):
                new_row["latitude"] = 0.0
            try:
                new_row["longitude"] = float(lng_val)
            except (ValueError, TypeError):
                new_row["longitude"] = 0.0
                
            new_row["contact"] = clean_value(raw.get(mapping["contact"])) if mapping.get("contact") else ""
            
        elif category == "inventory":
            new_row["name"] = clean_value(raw.get(mapping["name"])) if mapping.get("name") else f"Medicine {i+1}"
            
            qty_val = raw.get(mapping["quantity"]) if mapping.get("quantity") else "0"
            thresh_val = raw.get(mapping["minimumThreshold"]) if mapping.get("minimumThreshold") else "10"
            try:
                new_row["quantity"] = int(float(qty_val))
            except (ValueError, TypeError):
                new_row["quantity"] = 0
            try:
                new_row["minimumThreshold"] = int(float(thresh_val))
            except (ValueError, TypeError):
                new_row["minimumThreshold"] = 10
                
            new_row["unit"] = clean_value(raw.get(mapping["unit"])) if mapping.get("unit") else "units"
            new_row["lastUpdated"] = clean_value(raw.get(mapping["lastUpdated"])) if mapping.get("lastUpdated") else datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
            
        elif category == "diseases":
            new_row["id"] = raw.get(mapping["id"]) if mapping.get("id") else (i + 1)
            new_row["title"] = clean_value(raw.get(mapping["title"])) if mapping.get("title") else f"Disease {i+1}"
            new_row["title_lg"] = clean_value(raw.get(mapping["title_lg"])) if mapping.get("title_lg") else ""
            new_row["icon"] = clean_value(raw.get(mapping["icon"])) if mapping.get("icon") else "medical-bag"
            new_row["color"] = clean_value(raw.get(mapping["color"])) if mapping.get("color") else "#3182CE"
            
            # Safe JSON steps parsing
            steps_raw = raw.get(mapping["steps_json"]) if mapping.get("steps_json") else "[]"
            steps_lg_raw = raw.get(mapping["steps_lg_json"]) if mapping.get("steps_lg_json") else "[]"
            
            # If not already JSON, split by comma or semi-colon
            def parse_steps(s):
                s = clean_value(s)
                if not s:
                    return []
                if (s.startswith("[") and s.endswith("]")):
                    try:
                        return json.loads(s)
                    except json.JSONDecodeError:
                        pass
                return [item.strip() for item in s.split(";") if item.strip()]
                
            new_row["steps_json"] = json.dumps(parse_steps(steps_raw))
            new_row["steps_lg_json"] = json.dumps(parse_steps(steps_lg_raw))
            
        new_records.append(new_row)
        
    # Read existing DB records if appending
    existing_records = []
    existing_keys = set()
    
    if append_to_existing and os.path.exists(target_db_path):
        with open(target_db_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing_records.append(row)
                if category == "facilities":
                    existing_keys.add(row["name"].lower())
                elif category == "inventory":
                    existing_keys.add(row["name"].lower())
                elif category == "diseases":
                    existing_keys.add(row["title"].lower())
                    
    # Merge and avoid duplicates
    merged_records = list(existing_records)
    added_count = 0
    
    for rec in new_records:
        key = rec["name"].lower() if category in ["facilities", "inventory"] else rec["title"].lower()
        if key in existing_keys:
            # Overwrite/update existing
            for idx, ext in enumerate(merged_records):
                ext_key = ext["name"].lower() if category in ["facilities", "inventory"] else ext["title"].lower()
                if ext_key == key:
                    merged_records[idx] = rec
                    break
        else:
            merged_records.append(rec)
            existing_keys.add(key)
            added_count += 1
            
    # Sort or fix IDs
    if category in ["facilities", "diseases"]:
        for idx, rec in enumerate(merged_records):
            rec["id"] = idx + 1
            
    # Write back to target DB path
    target_schema = SCHEMA_FACILITIES if category == "facilities" else (SCHEMA_INVENTORY if category == "inventory" else SCHEMA_DISEASES)
    
    print(f"\nWriting to target seed file: {target_db_path}")
    with open(target_db_path, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=target_schema)
        writer.writeheader()
        for rec in merged_records:
            # Filter dict keys to standard schema
            filtered_rec = {k: rec.get(k, "") for k in target_schema}
            writer.writerow(filtered_rec)
            
    print(f"Success! Imported {len(new_records)} records from Kaggle/HDX.")
    print(f"Total records in system database seed: {len(merged_records)} (Added {added_count} new, updated {len(new_records) - added_count}).")
    
    # Prompt to update TypeScript seeds
    update_ts = input("\nWould you like to automatically rebuild the Typescript Seeds (csvSeeds.ts)? [Y/n]: ").strip().lower()
    if update_ts in ["", "y", "yes"]:
        rebuild_ts_seeds()

def rebuild_ts_seeds():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_dir = os.path.join(script_dir, "../src/db")
    
    fac_path = os.path.join(db_dir, "uganda_facilities.csv")
    inv_path = os.path.join(db_dir, "uganda_inventory.csv")
    dis_path = os.path.join(db_dir, "uganda_diseases.csv")
    seeds_ts_path = os.path.join(db_dir, "csvSeeds.ts")
    
    print(f"Rebuilding {seeds_ts_path}...")
    
    def read_csv_str(p):
        if os.path.exists(p):
            with open(p, 'r', encoding='utf-8') as f:
                return f.read().strip()
        return ""
        
    fac_str = read_csv_str(fac_path)
    inv_str = read_csv_str(inv_path)
    dis_str = read_csv_str(dis_path)
    
    ts_content = f"""export const FACILITIES_CSV = `{fac_str}`;

export const INVENTORY_CSV = `{inv_str}`;

export const DISEASES_CSV = `{dis_str}`;
"""
    
    with open(seeds_ts_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    print("TypeScript Seeds rebuilt successfully!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kaggle/HDX CSV Dynamic Schema Importer for HealthGuard Uganda")
    parser.add_argument("input_csv", help="Path to raw Kaggle/HDX downloaded CSV file")
    parser.add_argument("category", choices=["facilities", "inventory", "diseases"], help="Data category to import")
    parser.add_argument("--no-append", action="store_true", help="Overwrite existing database seed instead of merging")
    parser.add_argument("--rebuild-only", action="store_true", help="Skip import, just rebuild Typescript seeds from current CSV files")
    
    args = parser.parse_args()
    
    if args.rebuild_only:
        rebuild_ts_seeds()
    else:
        import_csv(args.input_csv, args.category, append_to_existing=not args.no_append)
