#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SCHEMA_FACILITIES = ["id", "name", "type", "latitude", "longitude", "contact"];
const SCHEMA_INVENTORY = ["name", "quantity", "unit", "minimumThreshold", "lastUpdated"];
const SCHEMA_DISEASES = ["id", "title", "title_lg", "icon", "color", "steps_json", "steps_lg_json"];

const MAPPINGS = {
    facilities: {
        name: ["facility", "clinic", "hospital", "name", "facility_name", "hosp_name", "title"],
        type: ["type", "level", "tier", "facility_type", "class", "category"],
        latitude: ["latitude", "lat", "y", "coord_lat", "latitude_deg"],
        longitude: ["longitude", "long", "lon", "x", "coord_long", "longitude_deg"],
        contact: ["contact", "phone", "telephone", "mobile", "email", "address"]
    },
    inventory: {
        name: ["name", "medicine", "drug", "item", "product", "description"],
        quantity: ["quantity", "qty", "stock", "count", "amount"],
        unit: ["unit", "pack", "form", "dosage_form"],
        minimumThreshold: ["minimumthreshold", "min_stock", "threshold", "min_qty", "alert_level"],
        lastUpdated: ["lastupdated", "updated", "date", "timestamp"]
    },
    diseases: {
        id: ["id", "code", "disease_id"],
        title: ["title", "name", "disease", "ailment", "condition"],
        title_lg: ["title_lg", "luganda", "local_name", "title_local"],
        icon: ["icon", "symbol", "image"],
        color: ["color", "hex", "theme"],
        steps_json: ["steps_json", "steps", "treatment", "guidelines", "protocol"],
        steps_lg_json: ["steps_lg_json", "steps_lg", "treatment_lg", "guidelines_lg"]
    }
};

// RFC-compliant CSV parser in JavaScript
function parseCSV(csvText) {
    const result = [];
    let row = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    currentField += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                row.push(currentField.trim());
                currentField = '';
            } else if (char === '\r' || char === '\n') {
                row.push(currentField.trim());
                if (row.length > 1 || row[0] !== '') {
                    result.push(row);
                }
                row = [];
                currentField = '';
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
            } else {
                currentField += char;
            }
        }
    }

    if (currentField !== '' || row.length > 0) {
        row.push(currentField.trim());
        if (row.length > 1 || row[0] !== '') {
            result.push(row);
        }
    }

    return result;
}

// Convert objects to CSV safely escaping quotes
function toCSV(records, headers) {
    const lines = [headers.join(',')];
    for (const rec of records) {
        const row = headers.map(h => {
            let val = rec[h] === undefined || rec[h] === null ? '' : String(rec[h]);
            if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
                val = '"' + val.replace(/"/g, '""') + '"';
            }
            return val;
        });
        lines.push(row.join(','));
    }
    return lines.join('\n');
}

function autoDetectMapping(headers, category) {
    const detected = {};
    const categoryMappings = MAPPINGS[category];
    
    for (const [targetCol, synonyms] of Object.entries(categoryMappings)) {
        let found = false;
        for (const syn of synonyms) {
            for (const h of headers) {
                if (syn.toLowerCase() === h.trim().toLowerCase() || h.trim().toLowerCase().replace(/\s+/g, '_').includes(syn.toLowerCase())) {
                    detected[targetCol] = h;
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
    }
    return detected;
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans.trim());
    }));
}

async function promptManualMapping(headers, category, autoMapped) {
    console.log(`\n--- Column Mapping Configuration for [${category.toUpperCase()}] ---`);
    console.log("Detected columns in raw CSV:");
    headers.forEach((h, idx) => {
        console.log(`  [${idx}] ${h}`);
    });
    console.log("\nWe need to map these to our database schema. Press Enter to accept auto-detection.");
    
    const finalMapping = {};
    const targetSchema = category === "facilities" ? SCHEMA_FACILITIES : (category === "inventory" ? SCHEMA_INVENTORY : SCHEMA_DISEASES);
    
    for (const target of targetSchema) {
        const defaultVal = autoMapped[target] || "";
        const defaultPrompt = defaultVal ? ` (Auto-detected: '${defaultVal}')` : "";
        
        while (true) {
            const choice = await askQuestion(`Select source column for '${target}'${defaultPrompt} [Enter Index/Name, or 'skip']: `);
            
            if (choice === "") {
                if (defaultVal) {
                    finalMapping[target] = defaultVal;
                    break;
                } else if (["contact", "title_lg", "steps_lg_json", "id", "icon", "color"].includes(target)) {
                    console.log(`Skipping optional field '${target}'`);
                    finalMapping[target] = null;
                    break;
                } else {
                    console.log(`Error: Field '${target}' is required. Please map it.`);
                }
            } else if (choice.toLowerCase() === "skip") {
                finalMapping[target] = null;
                break;
            } else {
                // Check if index
                const idx = parseInt(choice, 10);
                if (!isNaN(idx) && idx >= 0 && idx < headers.length) {
                    finalMapping[target] = headers[idx];
                    break;
                } else {
                    // Check if exact header match
                    const match = headers.find(h => h.toLowerCase() === choice.toLowerCase());
                    if (match) {
                        finalMapping[target] = match;
                        break;
                    } else {
                        console.log(`Header '${choice}' not found in raw CSV. Try again.`);
                    }
                }
            }
        }
    }
    return finalMapping;
}

function rebuildTsSeeds() {
    const dbDir = path.join(__dirname, "../src/db");
    const facPath = path.join(dbDir, "uganda_facilities.csv");
    const invPath = path.join(dbDir, "uganda_inventory.csv");
    const disPath = path.join(dbDir, "uganda_diseases.csv");
    const seedsTsPath = path.join(dbDir, "csvSeeds.ts");
    
    console.log(`Rebuilding ${seedsTsPath}...`);
    
    const readCSVStr = (p) => {
        if (fs.existsSync(p)) {
            return fs.readFileSync(p, 'utf8').trim();
        }
        return "";
    };
    
    const facStr = readCSVStr(facPath);
    const invStr = readCSVStr(invPath);
    const disStr = readCSVStr(disPath);
    
    const tsContent = `export const FACILITIES_CSV = \`${facStr}\`;

export const INVENTORY_CSV = \`${invStr}\`;

export const DISEASES_CSV = \`${disStr}\`;
`;
    
    fs.writeFileSync(seedsTsPath, tsContent, 'utf8');
    console.log("TypeScript Seeds rebuilt successfully!");
}

async function run() {
    const args = process.argv.slice(2);
    
    if (args.includes("--rebuild-only")) {
        rebuildTsSeeds();
        return;
    }
    
    if (args.length < 2) {
        console.log("Usage: node import_kaggle_dataset.js <input_csv_path> <category: facilities|inventory|diseases> [--no-append]");
        console.log("Or to rebuild ts seeds: node import_kaggle_dataset.js --rebuild-only");
        return;
    }
    
    const inputPath = args[0];
    const category = args[1];
    const noAppend = args.includes("--no-append");
    const appendToExisting = !noAppend;
    
    if (!["facilities", "inventory", "diseases"].includes(category)) {
        console.log("Error: Category must be one of: facilities, inventory, diseases");
        return;
    }
    
    if (!fs.existsSync(inputPath)) {
        console.log(`Error: Input CSV file '${inputPath}' not found.`);
        return;
    }
    
    const dbFileMap = {
        facilities: "../src/db/uganda_facilities.csv",
        inventory: "../src/db/uganda_inventory.csv",
        diseases: "../src/db/uganda_diseases.csv"
    };
    
    const targetDbPath = path.join(__dirname, dbFileMap[category]);
    
    console.log(`Reading raw Kaggle/HDX dataset from: ${inputPath}`);
    const csvContent = fs.readFileSync(inputPath, 'utf8');
    const parsedRows = parseCSV(csvContent);
    
    if (parsedRows.length <= 1) {
        console.log("Error: Input CSV is empty or only contains headers.");
        return;
    }
    
    const headers = parsedRows[0];
    const autoMapped = autoDetectMapping(headers, category);
    const mapping = await promptManualMapping(headers, category, autoMapped);
    
    const rawRecords = [];
    for (let i = 1; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const record = {};
        headers.forEach((h, idx) => {
            record[h] = row[idx] || "";
        });
        rawRecords.append || rawRecords.push(record);
    }
    
    const newRecords = [];
    
    rawRecords.forEach((raw, i) => {
        const newRow = {};
        
        if (category === "facilities") {
            newRow["id"] = mapping["id"] ? raw[mapping["id"]] : (i + 1);
            newRow["name"] = mapping["name"] ? raw[mapping["name"]].trim() : `Facility ${i+1}`;
            newRow["type"] = mapping["type"] ? raw[mapping["type"]].trim() : "Health Center";
            
            const latVal = mapping["latitude"] ? raw[mapping["latitude"]] : "0.0";
            const lngVal = mapping["longitude"] ? raw[mapping["longitude"]] : "0.0";
            newRow["latitude"] = parseFloat(latVal) || 0.0;
            newRow["longitude"] = parseFloat(lngVal) || 0.0;
            newRow["contact"] = mapping["contact"] ? raw[mapping["contact"]].trim() : "";
            
        } else if (category === "inventory") {
            newRow["name"] = mapping["name"] ? raw[mapping["name"]].trim() : `Medicine ${i+1}`;
            
            const qtyVal = mapping["quantity"] ? raw[mapping["quantity"]] : "0";
            const threshVal = mapping["minimumThreshold"] ? raw[mapping["minimumThreshold"]] : "10";
            newRow["quantity"] = parseInt(qtyVal, 10) || 0;
            newRow["minimumThreshold"] = parseInt(threshVal, 10) || 10;
            newRow["unit"] = mapping["unit"] ? raw[mapping["unit"]].trim() : "units";
            newRow["lastUpdated"] = mapping["lastUpdated"] ? raw[mapping["lastUpdated"]].trim() : new Date().toISOString();
            
        } else if (category === "diseases") {
            newRow["id"] = mapping["id"] ? raw[mapping["id"]] : (i + 1);
            newRow["title"] = mapping["title"] ? raw[mapping["title"]].trim() : `Disease ${i+1}`;
            newRow["title_lg"] = mapping["title_lg"] ? raw[mapping["title_lg"]].trim() : "";
            newRow["icon"] = mapping["icon"] ? raw[mapping["icon"]].trim() : "medical-bag";
            newRow["color"] = mapping["color"] ? raw[mapping["color"]].trim() : "#3182CE";
            
            const stepsRaw = mapping["steps_json"] ? raw[mapping["steps_json"]] : "[]";
            const stepsLgRaw = mapping["steps_lg_json"] ? raw[mapping["steps_lg_json"]] : "[]";
            
            const parseSteps = (s) => {
                s = (s || "").trim();
                if (!s) return [];
                if (s.startsWith("[") && s.endsWith("]")) {
                    try { return JSON.parse(s); } catch (e) {}
                }
                return s.split(";").map(item => item.trim()).filter(Boolean);
            };
            
            newRow["steps_json"] = JSON.stringify(parseSteps(stepsRaw));
            newRow["steps_lg_json"] = JSON.stringify(parseSteps(stepsLgRaw));
        }
        
        newRecords.push(newRow);
    });
    
    // Read existing DB records
    let existingRecords = [];
    const existingKeys = new Set();
    
    if (appendToExisting && fs.existsSync(targetDbPath)) {
        const dbContent = fs.readFileSync(targetDbPath, 'utf8');
        const dbRows = parseCSV(dbContent);
        if (dbRows.length > 1) {
            const dbHeaders = dbRows[0];
            for (let i = 1; i < dbRows.length; i++) {
                const row = dbRows[i];
                const rec = {};
                dbHeaders.forEach((h, idx) => {
                    rec[h] = row[idx] || "";
                });
                existingRecords.push(rec);
                
                const key = category === "facilities" ? rec["name"].toLowerCase() :
                            category === "inventory" ? rec["name"].toLowerCase() :
                            rec["title"].toLowerCase();
                existingKeys.add(key);
            }
        }
    }
    
    const mergedRecords = [...existingRecords];
    let addedCount = 0;
    
    newRecords.forEach(rec => {
        const key = category === "facilities" ? rec["name"].toLowerCase() :
                    category === "inventory" ? rec["name"].toLowerCase() :
                    rec["title"].toLowerCase();
                    
        if (existingKeys.has(key)) {
            // Overwrite/update existing
            const idx = mergedRecords.findIndex(ext => {
                const extKey = category === "facilities" ? ext["name"].toLowerCase() :
                               category === "inventory" ? ext["name"].toLowerCase() :
                               ext["title"].toLowerCase();
                return extKey === key;
            });
            if (idx !== -1) {
                mergedRecords[idx] = rec;
            }
        } else {
            mergedRecords.push(rec);
            existingKeys.add(key);
            addedCount++;
        }
    });
    
    // Sort or fix IDs
    if (["facilities", "diseases"].includes(category)) {
        mergedRecords.forEach((rec, idx) => {
            rec["id"] = idx + 1;
        });
    }
    
    const targetSchema = category === "facilities" ? SCHEMA_FACILITIES : (category === "inventory" ? SCHEMA_INVENTORY : SCHEMA_DISEASES);
    const outputCSV = toCSV(mergedRecords, targetSchema);
    
    console.log(`\nWriting to target seed file: ${targetDbPath}`);
    fs.writeFileSync(targetDbPath, outputCSV, 'utf8');
    
    console.log(`Success! Imported ${newRecords.length} records.`);
    console.log(`Total records in system seed: ${mergedRecords.length} (Added ${addedCount} new, updated ${newRecords.length - addedCount}).`);
    
    const ans = await askQuestion("\nWould you like to automatically rebuild the Typescript Seeds (csvSeeds.ts)? [Y/n]: ");
    if (ans.toLowerCase() === "" || ans.toLowerCase() === "y" || ans.toLowerCase() === "yes") {
        rebuildTsSeeds();
    }
}

if (require.main === module) {
    run().catch(err => {
        console.error("An error occurred:", err);
    });
}
