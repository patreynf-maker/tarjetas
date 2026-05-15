/**
 * Clover Parser
 * Parses clover.csv files exported from Clover POS
 * Filters by Resultado = SUCCESS, splits date/time, extracts card brand from QR notes
 */

import { parseCSV, csvToObjects } from '../utils/csvParser.js';

// Month name mapping for Spanish/English abbreviated months
const MONTH_MAP = {
    'ene': '01', 'jan': '01',
    'feb': '02',
    'mar': '03',
    'abr': '04', 'apr': '04',
    'may': '05',
    'jun': '06',
    'jul': '07',
    'ago': '08', 'aug': '08',
    'sep': '09', 'sept': '09',
    'oct': '10',
    'nov': '11',
    'dic': '12', 'dec': '12',
};

/**
 * @param {string} rawText - Raw CSV content from clover
 * @returns {{ columns: {key: string, label: string, type: string}[], rows: object[] }}
 */
export function parseClover(data) {
    let headers = [];
    let rowsObjects = [];

    if (typeof data === 'string') {
        const csvRows = parseCSV(data);
        const result = csvToObjects(csvRows);
        headers = result.headers;
        rowsObjects = result.data;
    } else if (Array.isArray(data)) {
        // Handle Array of Arrays (AoA) from XLSX
        if (data.length === 0) {
            throw new Error('El archivo Clover no contiene datos.');
        }
        headers = data[0].map(h => String(h || '').trim());
        const dataRows = data.slice(1);
        rowsObjects = dataRows.map(row => {
            const obj = {};
            headers.forEach((h, idx) => {
                if (h) obj[h] = row[idx] !== undefined ? row[idx] : '';
            });
            return obj;
        });
    }

    if (rowsObjects.length === 0) {
        throw new Error('El archivo Clover no contiene datos o el formato no es reconocido.');
    }

    // Find relevant column names (handle encoding issues with special chars)
    const colFechaPago = findColumn(headers, ['fecha del pago', 'fecha de pago', 'fecha']);
    const colResultado = findColumn(headers, ['resultado', 'result']);
    const colImporte = findColumn(headers, ['importe', 'amount']);
    const colNumLote = findColumn(headers, ['lote', 'num. de lote', 'núm. de lote', 'nãºm. de lote', 'num lote', 'numero de lote', 'batch']);
    const colNumRecibo = findColumn(headers, ['núm. de recibo', 'num. de recibo', 'recibo', 'receipt number', 'receipt', 'código de recibo']);
    const colMarcaTarjeta = findColumn(headers, ['marca de la tarjeta', 'marca tarjeta', 'card brand']);
    const colNota = findColumn(headers, ['nota', 'note']);

    // Filter only SUCCESS rows
    const successData = rowsObjects.filter(row => {
        const resultado = (row[colResultado] || '').trim().toLowerCase();
        return resultado === 'success';
    });

    // Format rows
    const formattedRows = successData.map((row, idx) => {
        const { fecha, hora } = parseFechaClover(row[colFechaPago] || '');
        const importe = parseImporteClover(row[colImporte] || '');
        let numLote = parseIntegerClover(row[colNumLote] || '');
        let marcaTarjeta = (row[colMarcaTarjeta] || '').trim();
        const nota = (row[colNota] || '').trim();

        // Extract card brand and lote from "ID QR" notes
        if (nota.toUpperCase().includes('ID QR')) {
            const medioMatch = nota.match(/medio\s*:\s*([^,;]+)/i);
            if (medioMatch && medioMatch[1]) {
                marcaTarjeta = medioMatch[1].trim();
            }
            const loteMatch = nota.match(/lote\s*:\s*([^,;]+)/i);
            if (loteMatch && loteMatch[1]) {
                numLote = parseIntegerClover(loteMatch[1].trim());
            }
        }

        // Determine Planilla (Turno)
        let planilla = '';

        return {
            'Fecha': fecha,
            'Hora': hora,
            'Planilla': planilla,
            'Importe': importe,
            'Núm. de lote': numLote,
            'Núm. de recibo': (row[colNumRecibo] || '').trim(),
            'Tarjeta': normalizeCloverCard(marcaTarjeta),
            'Nota': nota,
            '_importeRaw': parseFloat((row[colImporte] || '0').replace(/,/g, '').replace('.', '.')) || 0,
            '_id': `clover-${idx}-${Math.random().toString(36).substr(2, 9)}`,
        };
    });

    const columns = [
        { key: 'Fecha', label: 'Fecha', type: 'text' },
        { key: 'Hora', label: 'Hora', type: 'text' },
        { key: 'Planilla', label: 'Planilla', type: 'num' },
        { key: 'Importe', label: 'Importe', type: 'importe' },
        { key: 'Núm. de lote', label: 'Núm. de lote', type: 'num' },
        { key: 'Tarjeta', label: 'Tarjeta', type: 'text' },
    ];

    return { columns, rows: formattedRows };
}

/**
 * Find a column by checking various possible names (case-insensitive)
 */
function findColumn(headers, possibleNames) {
    for (const name of possibleNames) {
        const found = headers.find(h => h.toLowerCase().trim() === name);
        if (found) return found;
    }
    // Try partial match
    for (const name of possibleNames) {
        const found = headers.find(h => h.toLowerCase().trim().includes(name));
        if (found) return found;
    }
    // Return first possible name as fallback
    return possibleNames[0];
}

/**
 * Parse Clover date format: "04-Mar-2026 07:52 AM ART" -> { fecha: "04/03/2026", hora: "07:52" }
 */
function parseFechaClover(dateStr) {
    if (!dateStr) return { fecha: '', hora: '' };

    const str = dateStr.trim();

    // Pattern: DD-Mon-YYYY HH:MM AM/PM TZ
    const match = str.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?\s*([A-Z]*)?$/i);
    if (match) {
        const day = match[1].padStart(2, '0');
        const monthStr = match[2].toLowerCase();
        const year = match[3];
        let hour = parseInt(match[4]);
        const minute = match[5];
        const ampm = (match[6] || '').toUpperCase();

        const month = MONTH_MAP[monthStr] || '01';

        // Convert 12h to 24h
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;

        const hourStr = String(hour).padStart(2, '0');
        return {
            fecha: `${day}/${month}/${year}`,
            hora: `${hourStr}:${minute}`,
        };
    }

    // Fallback: try to extract date part only
    const match2 = str.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})/);
    if (match2) {
        const day = match2[1].padStart(2, '0');
        const monthStr = match2[2].toLowerCase();
        const year = match2[3];
        const month = MONTH_MAP[monthStr] || '01';
        return { fecha: `${day}/${month}/${year}`, hora: '' };
    }

    return { fecha: dateStr, hora: '' };
}

/**
 * Parse Clover importe (uses dot as decimal separator): "157181.44" -> "157.181,44"
 */
function parseImporteClover(val) {
    if (!val) return '';
    const cleaned = String(val).replace(/,/g, '').trim(); // remove commas if any
    const num = parseFloat(cleaned);
    if (isNaN(num)) return val;
    return formatNumber(num);
}

/**
 * Parse integer from string
 */
function parseIntegerClover(val) {
    if (!val) return '';
    const num = parseInt(String(val).replace(/[^0-9-]/g, ''));
    return isNaN(num) ? val : num;
}

/**
 * Find the matching Turno given a date and time
 * @param {string} fecha "DD/MM/YYYY"
 * @param {string} hora "HH:MM" (24h format)
 * @param {Array} turnos Array of user shifts
 * @returns {number|string}
 */
export function findTurnoForDateTime(fecha, hora, turnos) {
    // Convert transaction date/time to a timestamp object for easier comparison
    const [d, m, y] = fecha.split('/');
    const [h, min] = hora.split(':');

    // We create a Date object in local time for comparison
    const txDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min));

    // Reverse loop to check from bottom to top (in case of overlaps, usually bottom is the latest)
    for (let i = turnos.length - 1; i >= 0; i--) {
        const t = turnos[i];
        if (!t.fecha || !t.horaInicio || !t.horaFin || !t.turno) continue;

        const [td, tm, ty] = t.fecha.split('/');
        const [thStart, tmStart] = t.horaInicio.split(':');
        const [thEnd, tmEnd] = t.horaFin.split(':');

        const startTime = new Date(parseInt(ty), parseInt(tm) - 1, parseInt(td), parseInt(thStart), parseInt(tmStart));
        let endTime = new Date(parseInt(ty), parseInt(tm) - 1, parseInt(td), parseInt(thEnd), parseInt(tmEnd));

        // If end time is less than start time, it means the shift goes past midnight into the next day
        if (endTime < startTime) {
            endTime.setDate(endTime.getDate() + 1);
        }

        // Also check if the transaction is on the same logic day, but fell past midnight
        // E.g shift starts 22:00, ends 06:00 next day. Transaction is 01:00 the next day.
        // The transaction Date would be ty, tm, td + 1 day
        // To handle this properly, if the transaction is matched within the start/end absolute time objects, we are good.
        // We just need to check if txDate >= startTime && txDate <= endTime
        // However, the txDate from Clover already has its exact date and time.
        // But the user enters the shift date as the start date. 
        // So a transaction at 03/03/2026 01:00 AM belongs to the shift starting on 02/03/2026 22:00.
        // `txDate` will be 03/03/2026.
        // `startTime` will be 02/03/2026 22:00.
        // `endTime` will be 03/03/2026 06:00.
        // `txDate` is exactly between them! So simple timestamp comparison works perfectly.

        if (txDate.getTime() >= startTime.getTime() && txDate.getTime() <= endTime.getTime()) {
            return t.turno;
        }
    }

    return '';
}

/**
 * Extract a specific key's value from a note
 * Example note: "ID QR: 12345 medio: MASTERCARD DEBITO; lote: 123"
 */
function extractValueFromNota(nota, key) {
    const lower = nota.toLowerCase();
    const idx = lower.indexOf(key.toLowerCase());
    if (idx === -1) return null;

    // Get text after key
    let rest = nota.substring(idx + key.length).trim();

    // The value ends at the first comma or semicolon
    let endIdx = rest.length;
    const commaIdx = rest.indexOf(',');
    const semiIdx = rest.indexOf(';');

    if (commaIdx !== -1 && semiIdx !== -1) {
        endIdx = Math.min(commaIdx, semiIdx);
    } else if (commaIdx !== -1) {
        endIdx = commaIdx;
    } else if (semiIdx !== -1) {
        endIdx = semiIdx;
    }

    return rest.substring(0, endIdx).trim() || null;
}

/**
 * Normalize Clover card names:
 * - lowercase, remove numbers
 * - "visa" -> "visa credito"
 * - "transferencia" -> "TRANSFERENCIA"
 * - "mc debit" / "mastercard debit" -> "mc debito"
 */
function normalizeCloverCard(val) {
    if (!val) return '';
    let name = String(val).toLowerCase().trim();

    // Explicitly handle "transferencia" and "qr posnet"
    if (name.includes('transferencia') || name.includes('qr posnet')) {
        return 'TRANSFERENCIA';
    }

    // Remove numbers
    name = name.replace(/[0-9]/g, '').trim();

    // Specific mappings
    if (name === 'visa') {
        name = 'VISA CREDITO';
    } else if (name === 'mc debit' || name === 'mastercard debit' || name === 'mastercard debito') {
        name = 'MC DEBITO';
    } else if (name === 'mastercard' || name === 'mc' || name === 'master') {
        name = 'MC CREDITO';
    } else {
        name = name.toUpperCase();
    }

    return name;
}

/**
 * Format a number for display: 1234567.89 -> "1.234.567,89"
 */
function formatNumber(num) {
    const parts = num.toFixed(2).split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intPart},${parts[1]}`;
}
