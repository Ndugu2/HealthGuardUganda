import type { Facility, InventoryItem, AilmentGuide } from './types';

/**
 * Robust RFC-compliant CSV parser.
 * Handles quoted fields, embedded commas, double quotes, and CRLF newlines.
 */
export function parseCSV(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Double quotes within quotes escape to a single quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Closing quote
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
          i++; // Skip \n in \r\n
        }
      } else {
        currentField += char;
      }
    }
  }

  // Push final field/row if anything remains
  if (currentField !== '' || row.length > 0) {
    row.push(currentField.trim());
    if (row.length > 1 || row[0] !== '') {
      result.push(row);
    }
  }

  return result;
}

/**
 * Parses a facilities CSV into Facility objects.
 */
export function importFacilities(csvText: string): Facility[] {
  const rows = parseCSV(csvText);
  if (rows.length <= 1) return [];

  // Exclude header row
  const headers = rows[0].map(h => h.toLowerCase());
  const facilities: Facility[] = [];

  const idIdx = headers.indexOf('id');
  const nameIdx = headers.indexOf('name');
  const typeIdx = headers.indexOf('type');
  const latIdx = headers.indexOf('latitude');
  const lngIdx = headers.indexOf('longitude');
  const contactIdx = headers.indexOf('contact');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 5) continue;

    facilities.push({
      id: idIdx !== -1 ? Number(row[idIdx]) : i,
      name: nameIdx !== -1 ? row[nameIdx] : 'Unknown Clinic',
      type: typeIdx !== -1 ? row[typeIdx] : 'Health Center',
      latitude: latIdx !== -1 ? Number(row[latIdx]) : 0.0,
      longitude: lngIdx !== -1 ? Number(row[lngIdx]) : 0.0,
      contact: contactIdx !== -1 ? row[contactIdx] : '',
    });
  }

  return facilities;
}

/**
 * Parses an inventory CSV into InventoryItem objects.
 */
export function importInventory(csvText: string): InventoryItem[] {
  const rows = parseCSV(csvText);
  if (rows.length <= 1) return [];

  const headers = rows[0].map(h => h.toLowerCase());
  const inventory: InventoryItem[] = [];

  const nameIdx = headers.indexOf('name');
  const qtyIdx = headers.indexOf('quantity');
  const unitIdx = headers.indexOf('unit');
  const thresholdIdx = headers.indexOf('minimumthreshold');
  const dateIdx = headers.indexOf('lastupdated');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 4) continue;

    inventory.push({
      id: i,
      name: nameIdx !== -1 ? row[nameIdx] : 'Unknown Medicine',
      quantity: qtyIdx !== -1 ? Number(row[qtyIdx]) : 0,
      unit: unitIdx !== -1 ? row[unitIdx] : 'units',
      minimumThreshold: thresholdIdx !== -1 ? Number(row[thresholdIdx]) : 10,
      lastUpdated: dateIdx !== -1 ? row[dateIdx] : new Date().toISOString(),
    });
  }

  return inventory;
}

/**
 * Parses a diseases CSV into AilmentGuide objects.
 */
export function importDiseases(csvText: string): AilmentGuide[] {
  const rows = parseCSV(csvText);
  if (rows.length <= 1) return [];

  const headers = rows[0].map(h => h.toLowerCase());
  const guides: AilmentGuide[] = [];

  const idIdx = headers.indexOf('id');
  const titleIdx = headers.indexOf('title');
  const titleLgIdx = headers.indexOf('title_lg');
  const iconIdx = headers.indexOf('icon');
  const colorIdx = headers.indexOf('color');
  const stepsJsonIdx = headers.indexOf('steps_json');
  const stepsLgJsonIdx = headers.indexOf('steps_lg_json');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 5) continue;

    let steps: string[] = [];
    let steps_lg: string[] = [];

    try {
      if (stepsJsonIdx !== -1 && row[stepsJsonIdx]) {
        steps = JSON.parse(row[stepsJsonIdx]);
      }
    } catch (e) {
      console.warn('Failed to parse steps_json for row:', i, e);
    }

    try {
      if (stepsLgJsonIdx !== -1 && row[stepsLgJsonIdx]) {
        steps_lg = JSON.parse(row[stepsLgJsonIdx]);
      }
    } catch (e) {
      console.warn('Failed to parse steps_lg_json for row:', i, e);
    }

    guides.push({
      id: idIdx !== -1 ? Number(row[idIdx]) : i,
      title: titleIdx !== -1 ? row[titleIdx] : 'Unknown Ailment',
      title_lg: titleLgIdx !== -1 ? row[titleLgIdx] : undefined,
      icon: iconIdx !== -1 ? row[iconIdx] : 'medical-bag',
      color: colorIdx !== -1 ? row[colorIdx] : '#3182CE',
      steps,
      steps_lg: steps_lg.length > 0 ? steps_lg : undefined,
    });
  }

  return guides;
}
