/**
 * Parser for Pedidos Ya Excel files (Refined Version)
 */

export function parsePedidosYa(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('El archivo Pedidos Ya no contiene datos válidos o está vacío.');
    }

    // User mentioned deleting the first row. We'll start search from index 1.
    let headerRowIdx = -1;
    let headers = [];

    // Look for header row containing specific column names
    for (let i = 0; i < Math.min(data.length, 50); i++) {
        const potentialHeaders = (data[i] || []).map(h => String(h || '').trim());
        if (potentialHeaders.includes('Total del pedido') || potentialHeaders.includes('Entregado el')) {
            headerRowIdx = i;
            headers = potentialHeaders;
            break;
        }
    }

    if (headerRowIdx === -1) {
        // Fallback to row 1 if first row is metadata as user suggested
        headers = (data[1] || []).map(h => String(h || '').trim());
        headerRowIdx = 1;
    }

    const colNroPedido = headers.indexOf('Nro de pedido');
    const colEntregadoEl = headers.indexOf('Entregado el');
    const colTotal = headers.indexOf('Total del pedido');
    const colDescuento = headers.indexOf('Descuento total');
    const colPago = headers.indexOf('Forma de pago');
    const colEstado = headers.indexOf('Estado del pedido');

    const rows = data.slice(headerRowIdx + 1);
    const processedRows = rows.map((row, idx) => {
        const nroPedido = String(row[colNroPedido] || '').trim();
        if (!nroPedido) return null;

        // Filter by payment method: exclude "efectivo"
        const formaPago = String(row[colPago] || '').toLowerCase().trim();
        if (formaPago.includes('efectivo')) return null;

        // Date and Time parsing from "Entregado el" (e.g. "2026-03-11 09:54")
        const rawEntregado = row[colEntregadoEl];
        let fechaFormatted = '';
        let horaFormatted = '00:00';

        if (rawEntregado) {
            const strValue = String(rawEntregado).trim();
            // Format: YYYY-MM-DD HH:MM
            const parts = strValue.split(' ');
            if (parts[0]) {
                const dateParts = parts[0].split('-');
                if (dateParts.length === 3) {
                    fechaFormatted = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                } else {
                    fechaFormatted = parts[0]; // fallback
                }
            }
            if (parts[1]) {
                horaFormatted = parts[1].substring(0, 5); // HH:MM
            }
        }

        // Importe calculation: Total del pedido - Descuento total
        const totalVal = parseImporteValue(row[colTotal]);
        const descuentoVal = parseImporteValue(row[colDescuento]);
        const importeRaw = totalVal - descuentoVal;

        return {
            'Nro Pedido': nroPedido,
            'Fecha': fechaFormatted,
            'Hora': horaFormatted,
            'Planilla': '', // Will be assigned in main.js
            'Importe': formatNumber(importeRaw),
            'Estado': row[colEstado] || 'Entregado',
            '_importeRaw': importeRaw,
            '_id': `pedidosya-${idx}-${Math.random().toString(36).substr(2, 9)}`
        };
    }).filter(row => row !== null);

    const columns = [
        { key: 'Nro Pedido', label: 'Nro Pedido', type: 'num' },
        { key: 'Fecha', label: 'Fecha', type: 'text' },
        { key: 'Hora', label: 'Hora', type: 'text' },
        { key: 'Planilla', label: 'Planilla', type: 'num' },
        { key: 'Importe', label: 'Importe', type: 'importe' },
        { key: 'Estado', label: 'Estado', type: 'text' }
    ];

    return { columns, rows: processedRows };
}

function parseImporteValue(val) {
    if (typeof val === 'number') return val;
    const cleanStr = String(val || '0').trim();
    if (!cleanStr) return 0;
    return parseFloat(cleanStr.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatNumber(val) {
    if (isNaN(val)) return '0,00';
    return val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
