/**
 * CSV Parser Utility
 * Handles quoted fields, commas inside quotes, newlines, etc.
 */

/**
 * Parse CSV text into arrays
 * @param {string} text - Raw CSV text
 * @param {string} delimiter - Column delimiter (default: comma)
 * @returns {string[][]} Array of rows, each row is an array of cell values
 */
export function parseCSV(text, delimiter = 'auto') {
    if (delimiter === 'auto') {
        const firstLine = text.split('\n')[0] || '';
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semiCount = (firstLine.match(/;/g) || []).length;
        const tabCount = (firstLine.match(/\t/g) || []).length;

        if (semiCount > commaCount && semiCount > tabCount) {
            delimiter = ';';
        } else if (tabCount > commaCount && tabCount > semiCount) {
            delimiter = '\t';
        } else {
            delimiter = ',';
        }
    }

    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;
    let i = 0;

    while (i < text.length) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (insideQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote
                    currentField += '"';
                    i += 2;
                    continue;
                } else {
                    // End of quoted field
                    insideQuotes = false;
                    i++;
                    continue;
                }
            } else {
                currentField += char;
                i++;
                continue;
            }
        }

        // Not inside quotes
        if (char === '"') {
            insideQuotes = true;
            i++;
            continue;
        }

        if (char === delimiter) {
            currentRow.push(currentField.trim());
            currentField = '';
            i++;
            continue;
        }

        if (char === '\r' && nextChar === '\n') {
            currentRow.push(currentField.trim());
            if (currentRow.some(cell => cell !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentField = '';
            i += 2;
            continue;
        }

        if (char === '\n') {
            currentRow.push(currentField.trim());
            if (currentRow.some(cell => cell !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentField = '';
            i++;
            continue;
        }

        currentField += char;
        i++;
    }

    // Last field/row
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(cell => cell !== '')) {
            rows.push(currentRow);
        }
    }

    return rows;
}

/**
 * Convert parsed CSV rows into objects using headers
 * @param {string[][]} rows - Parsed CSV rows
 * @returns {{ headers: string[], data: object[] }}
 */
export function csvToObjects(rows) {
    if (rows.length === 0) return { headers: [], data: [] };

    const headers = rows[0];
    const data = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const obj = {};
        headers.forEach((header, idx) => {
            obj[header] = row[idx] || '';
        });
        data.push(obj);
    }

    return { headers, data };
}
