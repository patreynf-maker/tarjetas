import * as XLSX from 'xlsx';

/**
 * Parses an Excel or CSV file and returns an array of objects.
 */
export const parseFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Reconciles DEBO data with platform data.
 */
export const reconcile = (deboData, platformData, platformName) => {
    // Identify column names (they vary by platform based on Excel analysis)
    // DEBO usually has 'Cupón' and 'Importe'
    // APPYPF has 'ID'
    // MELI has 'Referencia externa'

    const results = [];
    const deboMap = new Map();

    // Format DEBO data for quick lookup
    deboData.forEach(row => {
        const coupon = String(row['Cupón'] || row['Cupon'] || "").trim();
        if (coupon) {
            deboMap.set(coupon, { ...row, found: false });
        }
    });

    // Iterate platform data
    platformData.forEach(row => {
        // Attempt to find the coupon identifier in platform row
        const coupon = String(
            row['ID'] ||
            row['Referencia externa'] ||
            row['Nro. de cupón'] ||
            row['Cupon'] ||
            ""
        ).trim();

        if (!coupon) return;

        const deboRow = deboMap.get(coupon);
        const platformAmount = parseFloat(String(row['Importe'] || row['Neto'] || row['Monto'] || "0").replace(',', '.'));

        if (deboRow) {
            deboRow.found = true;
            const deboAmount = parseFloat(String(deboRow['Importe'] || "0").replace(',', '.'));
            const diff = deboAmount - platformAmount;

            results.push({
                coupon,
                platformName,
                deboAmount,
                platformAmount,
                diff,
                status: Math.abs(diff) < 0.01 ? 'OK' : 'MISMATCH',
                details: row
            });
        } else {
            results.push({
                coupon,
                platformName,
                deboAmount: 0,
                platformAmount,
                diff: -platformAmount,
                status: 'EXTRA_IN_PLATFORM',
                details: row
            });
        }
    });

    // Add missing items (in DEBO but not in Platform)
    deboMap.forEach((val, coupon) => {
        if (!val.found) {
            const deboAmount = parseFloat(String(val['Importe'] || "0").replace(',', '.'));
            results.push({
                coupon,
                platformName,
                deboAmount,
                platformAmount: 0,
                diff: deboAmount,
                status: 'MISSING_IN_PLATFORM',
                details: val
            });
        }
    });

    return results;
};

/**
 * Exports data to Excel.
 */
export const exportToExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Conciliacion");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
