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

        // Within this planilla, group by Tarjeta
        const cardSet = new Set([
            ...deboInPlanilla.map(r => r.Tarjeta),
            ...cloverInPlanilla.map(r => r.Tarjeta)
        ]);

        // Add MercadoPago and App YPF groups if they have data, 
        // even if they don't appear as specific tarjetas in DEBO/Clover
        if (meliInPlanilla.length > 0) cardSet.add('MERCADOPAGO');
        if (appYpfInPlanilla.length > 0) cardSet.add('APP YPF');
        if (pedidosYaInPlanilla.length > 0) cardSet.add('PEDIDOS YA');

        const tarjetas = [...cardSet].filter(Boolean).sort();

        const cardGroups = {};
        let planillaTotalDebo = 0;
        let planillaTotalClover = 0; // This will actually be "Total External Source" (Clover or MELI)

        tarjetas.forEach(tarjeta => {
            if (!tarjeta) return;

            const deboInCard = deboInPlanilla.filter(r => r.Tarjeta === tarjeta);

            // SPECIAL CASES
            const isMeli = tarjeta.toUpperCase() === 'MERCADOPAGO';
            const isAppYpf = tarjeta.toUpperCase() === 'APP YPF';
            const isPedidosYa = tarjeta.toUpperCase() === 'PEDIDOS YA';

            let externalRows = [];
            if (isMeli) {
                externalRows = meliInPlanilla;
            } else if (isAppYpf) {
                externalRows = appYpfInPlanilla;
            } else if (isPedidosYa) {
                externalRows = pedidosYaInPlanilla;
            } else {
                externalRows = cloverInPlanilla.filter(r => r.Tarjeta === tarjeta);
            }

            // DUPLICATE DETECTION FOR DEBO in this group
            const couponCounts = {};
            deboInCard.forEach(r => {
                const cup = String(r['Cupón'] || '').trim();
                if (cup && cup !== '0') {
                    couponCounts[cup] = (couponCounts[cup] || 0) + 1;
                }
            });
            deboInCard.forEach(r => {
                const cup = String(r['Cupón'] || '').trim();
                if (cup && cup !== '0' && couponCounts[cup] > 1) {
                    r._isDuplicate = true;
                } else {
                    delete r._isDuplicate;
                }
            });

            const matched = [];
            const onlyDebo = [];
            const onlyExternal = [];

            const usedExternalIds = new Set();
            const usedDeboIds = new Set();

            // PASS 0: Manual Matches
            if (manualMatches && manualMatches.length > 0) {
                manualMatches.forEach(match => {
                    const dIdx = deboInCard.findIndex(r => r._id === match.deboId);
                    const eIdx = externalRows.findIndex(r => r._id === match.externalId);

                    if (dIdx !== -1 && eIdx !== -1) {
                        const dRow = deboInCard[dIdx];
                        const eRow = externalRows[eIdx];

                        if (!usedDeboIds.has(dRow._id) && !usedExternalIds.has(eRow._id)) {
                            usedDeboIds.add(dRow._id);
                            usedExternalIds.add(eRow._id);

                            const dImporte = parseDecimal(dRow.Importe);
                            const eImporte = parseDecimal(eRow.Importe);

                            matched.push({
                                debo: dRow,
                                clover: eRow,
                                status: Math.abs(dImporte - eImporte) > 0.01 ? 'diff' : 'ok',
                                diff: dImporte - eImporte,
                                isMeli,
                                isAppYpf,
                                isPedidosYa,
                                isManual: true
                            });
                        }
                    }
                });
            }

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
                        if (diff < minDiff) {
                            minDiff = diff;
                            foundIdx = extIdx;
                        }
                    });

                    if (foundIdx !== -1) {
                        const extRow = externalRows[foundIdx];
                        usedExternalIds.add(extRow._id);
                        usedDeboIds.add(dRow._id);
                        const extImporte = parseDecimal(extRow.Importe);
                        const hasDiff = Math.abs(dImporte - extImporte) > 0.01;
                        matched.push({
                            debo: dRow,
                            clover: extRow,
                            status: hasDiff ? 'diff' : 'ok',
                            diff: dImporte - extImporte,
                            isMeli: isMeli,
                            isAppYpf: isAppYpf,
                            isPedidosYa: isPedidosYa
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
                            foundIdx = extIdx;
                            break;
                        }
                    }

                    if (foundIdx !== -1) {
                        const extRow = externalRows[foundIdx];
                        usedExternalIds.add(extRow._id);
                        usedDeboIds.add(dRow._id);
                        matched.push({
                            debo: dRow,
                            clover: extRow,
                            status: 'ok',
                            diff: 0,
                            isMeli: isMeli,
                            isAppYpf: isAppYpf
                        });
                    }
                });

                // PASS 2: Removed as per request (Clover/Meli shouldn't match automatically with different amounts)
                deboInCard.forEach((dRow) => {
                    if (usedDeboIds.has(dRow._id)) return;
                    onlyDebo.push(dRow);
                });
            }

            externalRows.forEach((extRow) => {
                if (!usedExternalIds.has(extRow._id)) {
                    onlyExternal.push(extRow);
                }
            });

            const totalDebo = deboInCard.reduce((sum, r) => sum + parseDecimal(r.Importe), 0);
            const totalExternal = externalRows.reduce((sum, r) => sum + parseDecimal(r.Importe), 0);

            planillaTotalDebo += totalDebo;
            planillaTotalClover += totalExternal;

            cardGroups[tarjeta] = {
                matched,
                onlyDebo,
                onlyClover: onlyExternal, // UI compatibility
                totals: {
                    debo: totalDebo,
                    clover: totalExternal, // UI compatibility
                    diff: totalDebo - totalExternal
                },
                isMeli: isMeli,
                isAppYpf: isAppYpf,
                isPedidosYa: isPedidosYa
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
