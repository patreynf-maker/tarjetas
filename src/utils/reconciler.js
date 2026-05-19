/**
 * Reconciliation Utility
 * Matches records from DEBO and Clover based on common keys
 */

/**
 * Perform reconciliation between DEBO, Clover, MELI and APP YPF datasets
 * @param {Array} deboRows 
 * @param {Array} cloverRows 
 * @param {Array} meliRows Optional Mercado Pago rows
 * @param {Array} appYpfRows Optional APP YPF rows
 * @param {Array} pedidosYaRows Optional Pedidos Ya rows
 * @param {Array} activePlanillas Optional list of planilla numbers to include
 * @param {Array} manualMatches Optional user-defined matches [{deboId, externalId}]
 * @returns {Object} Grouped reconciliation results by Planilla -> Tarjeta
 */
export function reconcile(deboRows, cloverRows, meliRows = [], appYpfRows = [], pedidosYaRows = [], activePlanillas = null, manualMatches = []) {
    // 1. Filter: only keep rows that have a Planilla (assigned shifts)
    let filteredDebo = deboRows.filter(row => row.Planilla && String(row.Planilla).trim() !== '');
    let filteredClover = (cloverRows || []).filter(row => row.Planilla && String(row.Planilla).trim() !== '');
    let filteredMeli = (meliRows || []).filter(row => row.Planilla && String(row.Planilla).trim() !== '');
    let filteredAppYpf = (appYpfRows || []).filter(row => row.Planilla && String(row.Planilla).trim() !== '');
    let filteredPedidosYa = (pedidosYaRows || []).filter(row => row.Planilla && String(row.Planilla).trim() !== '');

    // 1.5 Filter by active planillas if provided
    if (activePlanillas && Array.isArray(activePlanillas)) {
        const activeSet = new Set(activePlanillas.map(String));
        filteredDebo = filteredDebo.filter(row => activeSet.has(String(row.Planilla)));
        filteredClover = filteredClover.filter(row => activeSet.has(String(row.Planilla)));
        filteredMeli = filteredMeli.filter(row => activeSet.has(String(row.Planilla)));
        filteredAppYpf = filteredAppYpf.filter(row => activeSet.has(String(row.Planilla)));
        filteredPedidosYa = filteredPedidosYa.filter(row => activeSet.has(String(row.Planilla)));
    }

    // 2. Identify all unique Planilla numbers
    const planillas = [...new Set([
        ...filteredDebo.map(r => String(r.Planilla)),
        ...filteredClover.map(r => String(r.Planilla)),
        ...filteredMeli.map(r => String(r.Planilla)),
        ...filteredAppYpf.map(r => String(r.Planilla)),
        ...filteredPedidosYa.map(r => String(r.Planilla))
    ])].sort((a, b) => parseInt(a) - parseInt(b));

    const result = {};

    planillas.forEach(planilla => {
        const deboInPlanilla = filteredDebo.filter(r => String(r.Planilla) === planilla);
        const cloverInPlanilla = filteredClover.filter(r => String(r.Planilla) === planilla);
        const meliInPlanilla = filteredMeli.filter(r => String(r.Planilla) === planilla);
        const appYpfInPlanilla = filteredAppYpf.filter(r => String(r.Planilla) === planilla);
        const pedidosYaInPlanilla = filteredPedidosYa.filter(r => String(r.Planilla) === planilla);

        // ── PRE-RESOLVE MANUAL MATCHES at planilla level (supports cross-tarjeta) ──
        // By resolving here, a DEBO row from VISA CREDITO can be matched to an
        // MC DEBITO external row — the DEBO row is "moved" to the target group
        // and flagged with _originalTarjeta so the UI can display its origin.
        const allExternalInPlanilla = [
            ...cloverInPlanilla,
            ...meliInPlanilla,
            ...appYpfInPlanilla,
            ...pedidosYaInPlanilla,
        ];

        const planillaUsedDeboIds = new Set();
        const planillaUsedExtIds = new Set();
        const resolvedByTarjeta = {}; // extTarjetaKey -> [resolvedMatch]

        if (manualMatches && manualMatches.length > 0) {
            manualMatches.forEach(match => {
                const dRow = deboInPlanilla.find(r => r._id === match.deboId);
                const eRow = allExternalInPlanilla.find(r => r._id === match.externalId);
                if (!dRow || !eRow) return;
                if (planillaUsedDeboIds.has(dRow._id) || planillaUsedExtIds.has(eRow._id)) return;

                const isMeli = meliInPlanilla.some(r => r._id === eRow._id);
                const isAppYpf = appYpfInPlanilla.some(r => r._id === eRow._id);
                const isPedidosYa = pedidosYaInPlanilla.some(r => r._id === eRow._id);
                const extTarjetaKey = isMeli ? 'MERCADOPAGO'
                    : isAppYpf ? 'APP YPF'
                    : isPedidosYa ? 'PEDIDOS YA'
                    : (eRow.Tarjeta || '');

                const isCross = dRow.Tarjeta !== extTarjetaKey;
                const dImporte = parseDecimal(dRow.Importe);
                const eImporte = parseDecimal(eRow.Importe);

                if (!resolvedByTarjeta[extTarjetaKey]) resolvedByTarjeta[extTarjetaKey] = [];
                resolvedByTarjeta[extTarjetaKey].push({
                    // Tag cross-matched DEBO rows with their original tarjeta
                    deboRow: isCross ? { ...dRow, _originalTarjeta: dRow.Tarjeta } : dRow,
                    extRow: eRow,
                    isCross,
                    isMeli, isAppYpf, isPedidosYa,
                    status: Math.abs(dImporte - eImporte) > 0.01 ? 'diff' : 'ok',
                    diff: dImporte - eImporte,
                });

                planillaUsedDeboIds.add(dRow._id);
                planillaUsedExtIds.add(eRow._id);
            });
        }

        // Within this planilla, group by Tarjeta
        const cardSet = new Set([
            ...deboInPlanilla.map(r => r.Tarjeta),
            ...cloverInPlanilla.map(r => r.Tarjeta)
        ]);
        if (meliInPlanilla.length > 0) cardSet.add('MERCADOPAGO');
        if (appYpfInPlanilla.length > 0) cardSet.add('APP YPF');
        if (pedidosYaInPlanilla.length > 0) cardSet.add('PEDIDOS YA');
        // Ensure tarjeta groups from cross-matches also appear in the set
        Object.keys(resolvedByTarjeta).forEach(k => cardSet.add(k));

        const tarjetas = [...cardSet].filter(Boolean).sort();

        const cardGroups = {};
        let planillaTotalDebo = 0;
        let planillaTotalClover = 0;

        tarjetas.forEach(tarjeta => {
            if (!tarjeta) return;

            const isMeli = tarjeta.toUpperCase() === 'MERCADOPAGO';
            const isAppYpf = tarjeta.toUpperCase() === 'APP YPF';
            const isPedidosYa = tarjeta.toUpperCase() === 'PEDIDOS YA';

            // Exclude DEBO rows already consumed by planilla-level manual matches
            const deboInCard = deboInPlanilla.filter(r =>
                r.Tarjeta === tarjeta && !planillaUsedDeboIds.has(r._id)
            );

            // Exclude external rows already consumed by planilla-level manual matches
            let baseExternalRows = [];
            if (isMeli) baseExternalRows = meliInPlanilla;
            else if (isAppYpf) baseExternalRows = appYpfInPlanilla;
            else if (isPedidosYa) baseExternalRows = pedidosYaInPlanilla;
            else baseExternalRows = cloverInPlanilla.filter(r => r.Tarjeta === tarjeta);
            const externalRows = baseExternalRows.filter(r => !planillaUsedExtIds.has(r._id));

            // DUPLICATE DETECTION FOR DEBO in this group
            const couponCounts = {};
            deboInCard.forEach(r => {
                const cup = String(r['Cupón'] || '').trim();
                if (cup && cup !== '0') couponCounts[cup] = (couponCounts[cup] || 0) + 1;
            });
            deboInCard.forEach(r => {
                const cup = String(r['Cupón'] || '').trim();
                if (cup && cup !== '0' && couponCounts[cup] > 1) r._isDuplicate = true;
                else delete r._isDuplicate;
            });

            const matched = [];
            const onlyDebo = [];
            const onlyExternal = [];
            const usedExternalIds = new Set();
            const usedDeboIds = new Set();

            // PASS 0: Pre-resolved manual matches for this tarjeta group
            const manualForThisTarjeta = resolvedByTarjeta[tarjeta] || [];
            manualForThisTarjeta.forEach(m => {
                usedDeboIds.add(m.deboRow._id);
                usedExternalIds.add(m.extRow._id);
                matched.push({
                    debo: m.deboRow,   // has _originalTarjeta if cross-matched
                    clover: m.extRow,
                    status: m.status,
                    diff: m.diff,
                    isMeli: m.isMeli,
                    isAppYpf: m.isAppYpf,
                    isPedidosYa: m.isPedidosYa,
                    isManual: true,
                    isCrossMatch: m.isCross,
                });
            });

            // Two-Pass Match Logic
            if (isAppYpf) {
                // SPECIAL MATCHING FOR APP YPF: By Amount (within tolerance)
                deboInCard.forEach((dRow) => {
                    if (usedDeboIds.has(dRow._id)) return;
                    const dImporte = parseDecimal(dRow.Importe);
                    let foundIdx = -1;
                    let minDiff = 5.0; // Tolerance: up to 5 pesos difference

                    externalRows.forEach((extRow, extIdx) => {
                        if (usedExternalIds.has(extRow._id)) return;
                        const extImporte = parseDecimal(extRow.Importe);
                        const diff = Math.abs(dImporte - extImporte);
                        if (diff < minDiff) { minDiff = diff; foundIdx = extIdx; }
                    });

                    if (foundIdx !== -1) {
                        const extRow = externalRows[foundIdx];
                        usedExternalIds.add(extRow._id);
                        usedDeboIds.add(dRow._id);
                        const extImporte = parseDecimal(extRow.Importe);
                        matched.push({
                            debo: dRow, clover: extRow,
                            status: Math.abs(dImporte - extImporte) > 0.01 ? 'diff' : 'ok',
                            diff: dImporte - extImporte,
                            isMeli, isAppYpf, isPedidosYa
                        });
                    } else {
                        onlyDebo.push(dRow);
                    }
                });
            } else {
                // PASS 1: Perfect Matches (Lote AND Importe)
                deboInCard.forEach((dRow) => {
                    if (usedDeboIds.has(dRow._id)) return;
                    const dLote = String(dRow.Lote || '').trim();
                    const dImporte = parseDecimal(dRow.Importe);
                    if (!dLote) return;

                    let foundIdx = -1;
                    for (let extIdx = 0; extIdx < externalRows.length; extIdx++) {
                        const extRow = externalRows[extIdx];
                        if (usedExternalIds.has(extRow._id)) continue;
                        const extLote = isMeli
                            ? String(extRow['Referencia ext.'] || '').trim()
                            : String(extRow['Núm. de lote'] || '').trim();
                        const extImporte = parseDecimal(extRow.Importe);
                        if (extLote === dLote && Math.abs(extImporte - dImporte) < 0.01) {
                            foundIdx = extIdx; break;
                        }
                    }

                    if (foundIdx !== -1) {
                        const extRow = externalRows[foundIdx];
                        usedExternalIds.add(extRow._id);
                        usedDeboIds.add(dRow._id);
                        matched.push({ debo: dRow, clover: extRow, status: 'ok', diff: 0, isMeli, isAppYpf });
                    }
                });

                // Remaining unmatched DEBO rows
                deboInCard.forEach((dRow) => {
                    if (usedDeboIds.has(dRow._id)) return;
                    onlyDebo.push(dRow);
                });
            }

            externalRows.forEach((extRow) => {
                if (!usedExternalIds.has(extRow._id)) onlyExternal.push(extRow);
            });

            // Totals: include manual cross-match rows in this group's totals
            const manualDeboImportes = manualForThisTarjeta.reduce((sum, m) => sum + parseDecimal(m.deboRow.Importe), 0);
            const manualExtImportes = manualForThisTarjeta.reduce((sum, m) => sum + parseDecimal(m.extRow.Importe), 0);
            const totalDebo = deboInCard.reduce((sum, r) => sum + parseDecimal(r.Importe), 0) + manualDeboImportes;
            const totalExternal = externalRows.reduce((sum, r) => sum + parseDecimal(r.Importe), 0) + manualExtImportes;

            planillaTotalDebo += totalDebo;
            planillaTotalClover += totalExternal;

            cardGroups[tarjeta] = {
                matched, onlyDebo, onlyClover: onlyExternal,
                totals: { debo: totalDebo, clover: totalExternal, diff: totalDebo - totalExternal },
                isMeli, isAppYpf, isPedidosYa
            };
        });

        result[planilla] = {
            tarjetas: cardGroups,
            totals: {
                debo: planillaTotalDebo,
                clover: planillaTotalClover,
                diff: planillaTotalDebo - planillaTotalClover
            }
        };
    });

    return result;
}

/**
 * Helper to convert formatted string back to number
 */
function parseDecimal(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleaned = String(val).replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(cleaned) || 0;
}
