/**
 * Parser for Mercado Pago (MELI) CSV files
 */

import { parseCSV, csvToObjects } from '../utils/csvParser';

/**
 * Parses MELI data (CSV or XLSX rows)
 * @param {string|Array} data CSV text or Array of objects from XLSX
 * @returns {Object} { headers: Array, rows: Array }
 */
export function parseMeli(data, mode = 'playa') {
    if (!data) return { headers: [], rows: [] };

    const filterCaja = mode === 'shop' ? 'tienda' : 'surtidor';
    console.log(`Parsing MELI in mode: ${mode}, filtering for: ${filterCaja}`);

    let rawRows = [];

    if (typeof data === 'string') {
        const lines = data.split(/\r?\n/);
        let headerIndex = -1;

        // Find the header line starting with "Número de operación"
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('Número de operación')) {
                headerIndex = i;
                break;
            }
        }

        if (headerIndex === -1) {
            throw new Error('No se encontró la cabecera "Número de operación" en el archivo CSV de Mercado Pago.');
        }

        const validCsv = lines.slice(headerIndex).join('\n');
        const rowsAOA = parseCSV(validCsv);
        const { data: objects } = csvToObjects(rowsAOA);
        rawRows = objects;
    } else if (Array.isArray(data)) {
        // Handle Array of Arrays (from XLSX)
        let headerRowIndex = -1;
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (row && Array.isArray(row) && row.some(cell => String(cell).includes('Número de operación'))) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
            throw new Error('No se encontró la cabecera "Número de operación" en el archivo Excel.');
        }

        const headers = data[headerRowIndex];
        const dataRows = data.slice(headerRowIndex + 1);

        if (!headers || !Array.isArray(headers)) {
            throw new Error('La cabecera del archivo Excel no es válida.');
        }

        rawRows = (dataRows || []).map(row => {
            const obj = {};
            if (row && Array.isArray(row)) {
                headers.forEach((h, index) => {
                    if (h !== undefined && h !== null) {
                        obj[String(h)] = row[index] !== undefined ? row[index] : '';
                    }
                });
            }
            return obj;
        }).filter(obj => Object.keys(obj).length > 0);
    }

    if (!Array.isArray(rawRows)) {
        rawRows = [];
    }

    // Helper functions
    const parseFechaMeli = (fechaCompra) => {
        let fecha = '';
        let hora = '';
        if (fechaCompra) {
            const matches = fechaCompra.match(/(\d+)\s+([a-z]+)\s+(\d{2}:\d{2})/i);
            if (matches) {
                const day = matches[1].padStart(2, '0');
                const monthName = matches[2].toLowerCase();
                const timeStr = matches[3];

                const months = {
                    'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
                    'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
                    'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
                };

                const month = months[monthName] || '01';
                // Assuming current year or a reasonable default, e.g., 2026 as in original
                fecha = `${day}/${month}/2026`;
                hora = timeStr;
            }
        }
        return { fecha, hora };
    };

    const parseImporteMeli = (cobro) => {
        return parseFloat(String(cobro).replace(',', '.')) || 0;
    };

    // Process and filter rows
    const processedRows = (rawRows || []).map((row, idx) => {
        const { fecha, hora } = parseFechaMeli(row['Fecha de la compra'] || '');
        const importeRaw = parseImporteMeli(row['Cobro'] || '0');

        let caja = (row['Caja'] || '').trim();
        const cajaRaw = caja;
        if (cajaRaw.includes('#')) {
            caja = cajaRaw.split('#')[0].trim();
        }

        const refExt = row['Referencia externa'] || '';
        const estado = (row['Estado'] || '').toLowerCase().trim();

        return {
            'Fecha': fecha,
            'Hora': hora,
            'Planilla': '',
            'Importe': formatNumber(importeRaw),
            'Caja': caja,
            'Referencia ext.': parseInt(refExt) || '',
            'Operación': row['Número de operación'] || '',
            'Estado': row['Estado'] || '',
            '_importeRaw': importeRaw,
            '_isApproved': estado === 'aprobado',
            '_id': `meli-${idx}-${Math.random().toString(36).substr(2, 9)}`
        };
    }).filter(row => row.Caja.toLowerCase().includes(filterCaja) && row._isApproved);

    const columns = [
        { key: 'Fecha', label: 'Fecha', type: 'text' },
        { key: 'Hora', label: 'Hora', type: 'text' },
        { key: 'Planilla', label: 'Planilla', type: 'num' },
        { key: 'Importe', label: 'Importe', type: 'importe' },
        { key: 'Caja', label: 'Caja', type: 'text' },
        { key: 'Referencia ext.', label: 'Ref. Ext', type: 'text' },
    ];

    return { columns, rows: processedRows };
}

/**
 * Format a number for display: 1234567.89 -> "1.234.567,89"
 */
function formatNumber(num) {
    const parts = num.toFixed(2).split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intPart},${parts[1]}`;
}
