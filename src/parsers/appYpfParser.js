/**
 * Parser for APP YPF (YPF App) Excel files
 */

export function parseAppYpf(data, mode = 'playa') {
    if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('El archivo APP YPF no contiene datos válidos o está vacío.');
    }

    const filterArea = mode === 'shop' ? 'tienda' : 'playa';
    console.log(`Parsing AppYPF in mode: ${mode}, filtering for: ${filterArea}`);

    // ... (rest of search/validation code) ...
    // Find header row - it might not be the first one
    let headerRowIdx = -1;
    let headers = [];

    for (let i = 0; i < Math.min(data.length, 20); i++) {
        const potentialHeaders = (data[i] || []).map(h => String(h || '').trim());
        // Look for row that has ID and (Fecha or Hora)
        if (potentialHeaders.includes('ID') && (potentialHeaders.includes('Fecha') || potentialHeaders.includes('Hora'))) {
            headerRowIdx = i;
            headers = potentialHeaders;
            break;
        }
    }

    if (headerRowIdx === -1) {
        // Fallback: try row 0 if we can't find a clear header row
        headers = (data[0] || []).map(h => String(h || '').trim());
        headerRowIdx = 0;
    }

    // Find column indices
    const idIdx = headers.indexOf('ID');
    const fechaIdx = headers.indexOf('Fecha');
    const horaIdx = headers.indexOf('Hora');

    // Look for Área by name or position (after APIES as user suggested)
    let areaIdx = headers.findIndex(h => h.toLowerCase().includes('área') || h.toLowerCase().includes('area'));
    if (areaIdx === -1) {
        const apiesIdx = headers.indexOf('APIES');
        if (apiesIdx !== -1) areaIdx = apiesIdx + 1;
    }

    let impIdx = headers.indexOf('Importe con descuento y redención');
    if (impIdx === -1) {
        impIdx = headers.findIndex(h => h.includes('Importe') && (h.includes('descuento') || h.includes('redención')));
    }
    if (impIdx === -1) impIdx = headers.indexOf('Importe');

    // Validation - ID is critical, Fecha or Hora is critical
    if (idIdx === -1 || (fechaIdx === -1 && horaIdx === -1)) {
        console.error("Columnas críticas no encontradas. Headers:", headers);
        throw new Error('No se encontraron las columnas requeridas (ID, Fecha/Hora) en el archivo APP YPF.');
    }

    const rows = data.slice(headerRowIdx + 1);
    const processedRows = rows.map((row, idx) => {
        // Area filtering logic
        if (areaIdx === -1) return null;

        const areaValue = String(row[areaIdx] || '').trim();
        if (areaValue.toLowerCase() !== filterArea) return null;

        const id = row[idIdx];
        const rawFecha = row[fechaIdx];
        const rawHora = row[horaIdx];
        const rawImporte = row[impIdx];

        // --- Date formatting ---
        let fechaFormatted = '';
        if (typeof rawFecha === 'number') {
            // Excel date
            const dateObj = new Date(Math.round((rawFecha - 25569) * 86400 * 1000));
            fechaFormatted = dateObj.toLocaleDateString('es-AR');
        } else if (rawFecha) {
            fechaFormatted = String(rawFecha).split(' ')[0];
        }

        // --- Time formatting (Ensure 24h) ---
        let horaFormatted = '';
        if (typeof rawHora === 'string') {
            // "03:49:31 AM" -> "03:49"
            const parts = String(rawHora).trim().split(' ');
            let [h, m] = parts[0].split(':');
            const ampm = parts[1] ? parts[1].toUpperCase() : '';

            let hour = parseInt(h);
            if (ampm === 'PM' && hour < 12) hour += 12;
            if (ampm === 'AM' && hour === 12) hour = 0;

            horaFormatted = `${String(hour).padStart(2, '0')}:${String(m || '00').padStart(2, '0')}`;
        } else if (typeof rawHora === 'number') {
            // Excel time (fraction of 1)
            const totalSeconds = Math.round(rawHora * 86400);
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            horaFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }

        // --- Importe formatting ---
        // APP YPF standard is 123456.78
        let importeRaw = 0;
        if (typeof rawImporte === 'number') {
            importeRaw = rawImporte;
        } else {
            const cleanStr = String(rawImporte || '0').trim();
            // If it has a comma, it might be the AR format (1.234,56). Otherwise assume standard (1234.56)
            if (cleanStr.includes(',')) {
                importeRaw = parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
            } else {
                importeRaw = parseFloat(cleanStr);
            }
        }

        return {
            'ID': id,
            'Fecha': fechaFormatted,
            'Hora': horaFormatted,
            'Planilla': '', // Assignment in main.js
            'Importe': formatNumber(importeRaw),
            'Área': areaValue,
            '_importeRaw': importeRaw,
            '_id': `appypf-${idx}-${Math.random().toString(36).substr(2, 9)}`
        };
    }).filter(row => row !== null);

    const columns = [
        { key: 'ID', label: 'ID', type: 'num' },
        { key: 'Fecha', label: 'Fecha', type: 'text' },
        { key: 'Hora', label: 'Hora', type: 'text' },
        { key: 'Planilla', label: 'Planilla', type: 'num' },
        { key: 'Importe', label: 'Importe', type: 'importe' },
        { key: 'Área', label: 'Área', type: 'text' }
    ];

    return { columns, rows: processedRows };
}

function formatNumber(val) {
    if (isNaN(val)) return '0,00';
    return val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
