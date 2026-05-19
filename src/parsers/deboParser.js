/**
 * Debo Parser
 * Parses tab-separated debo.txt files
 * Strips header lines, extracts and formats the data table
 */

/**
 * @param {string} rawText - Raw content of debo.txt
 * @returns {{ columns: string[], rows: object[] }}
 */
export function parseDebo(rawText) {
    const lines = rawText.split(/\r?\n/).filter(line => line.trim() !== '');

    // Find the header row (starts with "Fecha\tCodigo" or similar)
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const lower = lines[i].toLowerCase();
        if (lower.startsWith('fecha') && (lower.includes('codigo') || lower.includes('código'))) {
            headerIndex = i;
            break;
        }
    }

    if (headerIndex === -1) {
        throw new Error('No se encontró la fila de encabezados en el archivo DEBO. Asegúrese de que el archivo contiene una línea que comienza con "Fecha" seguida de "Codigo".');
    }

    // Parse header
    const headerLine = lines[headerIndex];
    const rawHeaders = headerLine.split('\t').map(h => h.trim()).filter(h => h !== '');

    // Find relevant column names
    const colFecha = findColumn(rawHeaders, ['fecha', 'date']);
    const colNombre = findColumn(rawHeaders, ['nombre', 'tarjeta', 'card', 'description']);
    const colPlanilla = findColumn(rawHeaders, ['planilla', 'turno']);
    const colImporte = findColumn(rawHeaders, ['importe', 'monto', 'amount']);
    let colCupon = findColumn(rawHeaders, ['cupón', 'cupon', 'comprobante', 'operación', 'operacion', 'ticket', 'nro', 'voucher', 'cup']);
    const colLote = findColumn(rawHeaders, ['lote', 'batch']);

    // Debugging: help identify column mismatch in browser console
    console.log('DEBO Headers detection:', { colFecha, colNombre, colPlanilla, colImporte, colCupon, colLote, allHeaders: rawHeaders });

    // Positional fallback for Cupón: if not found by name, it is almost always the column immediately after Importe
    if (!colCupon && colImporte) {
        const impIdx = rawHeaders.indexOf(colImporte);
        if (impIdx !== -1 && impIdx + 1 < rawHeaders.length) {
            colCupon = rawHeaders[impIdx + 1];
            console.log('DEBO: Cupón matched by position (next to Importe):', colCupon);
        }
    }

    // Parse data rows
    const rows = [];
    for (let i = headerIndex + 1; i < lines.length; i++) {
        const cells = lines[i].split('\t').map(c => c.trim());
        if (cells.length < rawHeaders.length * 0.5 || !cells[0]) continue; // skip incomplete rows

        const rowData = {};
        rawHeaders.forEach((header, idx) => {
            rowData[header] = cells[idx] || '';
        });

        rows.push({
            'Fecha': formatFecha(rowData[colFecha] || ''),
            'Tarjeta': normalizeDeboCard(rowData[colNombre] || ''),
            'Planilla': colPlanilla ? parseInteger(rowData[colPlanilla]) : '',
            'Importe': colImporte ? parseDecimal(rowData[colImporte]) : '',
            'Cupón': colCupon ? parseInteger(rowData[colCupon]) : '',
            'Lote': colLote ? parseInteger(rowData[colLote]) : '',
            // Keep raw importe for sorting
            '_importeRaw': colImporte ? (parseFloat((rowData[colImporte] || '0').replace(/\./g, '').replace(',', '.')) || 0) : 0,
            '_id': `debo-${i}-${Math.random().toString(36).substr(2, 9)}`,
        });
    }

    const columns = [
        { key: 'Fecha', label: 'Fecha', type: 'text' },
        { key: 'Tarjeta', label: 'Tarjeta', type: 'text' },
        { key: 'Planilla', label: 'Planilla', type: 'num' },
        { key: 'Importe', label: 'Importe', type: 'importe' },
        { key: 'Cupón', label: 'Cupón', type: 'num' },
        { key: 'Lote', label: 'Lote', type: 'num' },
    ];

    return { columns, rows };
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
    // Return null if not found
    return null;
}

/**
 * Format date to dd/mm/aaaa
 */
function formatFecha(dateStr) {
    if (!dateStr) return '';
    // Already in dd/mm/yyyy format
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) return dateStr;

    // Try yyyy-mm-dd
    const match2 = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match2) return `${match2[3]}/${match2[2]}/${match2[1]}`;

    // Try dd-mm-yyyy
    const match3 = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (match3) return `${match3[1]}/${match3[2]}/${match3[3]}`;

    return dateStr; // return as-is if no pattern matches
}

/**
 * Parse integer from string, handling comma decimals
 */
function parseInteger(val) {
    if (!val) return '';
    // Remove decimal part if present (e.g., "2285,0000" -> 2285)
    const cleaned = String(val).replace(/\./g, '').replace(',', '.').trim();
    const num = parseInt(parseFloat(cleaned));
    return isNaN(num) ? val : num;
}

/**
 * Parse decimal number, format with comma separator
 */
function parseDecimal(val) {
    if (!val) return '';
    // Convert from "5300,0000" format to number
    const cleaned = String(val).replace(/\./g, '').replace(',', '.').trim();
    const num = parseFloat(cleaned);
    if (isNaN(num)) return val;

    // Format with 2 decimal places and comma separator
    return formatNumber(num);
}

/**
 * Format a number for display: 1234567.89 -> "1.234.567,89"
 */
function formatNumber(num) {
    const parts = num.toFixed(2).split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intPart},${parts[1]}`;
}

/**
 * Normalize Debo card names
 * - lowercase
 * - remove "(clover)"
 * - remove any numbers
 */
function normalizeDeboCard(val) {
    if (!val) return '';
    let name = String(val).toLowerCase().trim();

    // Explicitly handle "transferencia" and "pagoinmediato"
    if (name.includes('transferencia') || name.includes('pagoinmediato')) {
        return 'TRANSFERENCIA';
    }

    // Handle Mercado Pago variants
    if (name.includes('mercado pago') || name.includes('mercadopago') || name === 'qr' || name === 'mercado_pago') {
        return 'MERCADOPAGO';
    }

    // Handle App YPF variants
    if (name.includes('descuentos app ypf')) {
        return 'DESCUENTOS APP YPF';
    }
    if (name.includes('app ypf') || name.includes('appyf') || name.includes('ypf app') || name.includes('ypfapp')) {
        return 'APP YPF';
    }

    // Specific mappings for unification with Clover
    if (name === 'american express') {
        return 'AMEX';
    }
    if (name === 'mastercard debit' || name === 'mc debit' || name === 'mastercard debito' || name === 'mc debito') {
        return 'MC DEBITO';
    }
    if (name === 'mastercard' || name === 'mc' || name === 'master') {
        return 'MC CREDITO';
    }
    if (name === 'visa') {
        return 'VISA CREDITO';
    }
    if (name.includes('qr posnet')) {
        return 'TRANSFERENCIA';
    }

    // Remove (clover)
    name = name.replace(/\(clover\)/g, '').trim();
    // Remove numbers
    name = name.replace(/[0-9]/g, '').trim();

    return name.toUpperCase();
}
