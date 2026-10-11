/**
 * Ventures in Salt: Compass Minerals International
 * 前端儀表板控制器與 Google 試算表連動模組
 */

let sim = null;
let charts = {};

const STORAGE_KEY_WEBHOOK = "salt_gas_webhook_url";
const STORAGE_KEY_CLASS = "salt_student_class";
const STORAGE_KEY_ID = "salt_student_id";
const STORAGE_KEY_NAME = "salt_student_name";

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    initSimulation();
    setupInputs();
    setupCharts();
    setupGoogleSheetsModule();
    updateUI();
});

function initSimulation() {
    sim = new SaltVenturesEngine();
}

function resetSimulation() {
    if (confirm("確定要重新開局嗎？當前經營進度將被重置。")) {
        sim.reset();
        updateUI();
    }
}

function setupInputs() {
    // 1. 價格滑桿聯動
    const sliderHighway = document.getElementById('slider-priceHighway');
    const inputHighway = document.getElementById('input-priceHighway');
    const sliderGeneral = document.getElementById('slider-priceGeneral');
    const inputGeneral = document.getElementById('input-priceGeneral');

    if (sliderHighway && inputHighway) {
        sliderHighway.addEventListener('input', (e) => {
            inputHighway.value = e.target.value;
            calculateForecast();
        });
        inputHighway.addEventListener('input', (e) => {
            sliderHighway.value = e.target.value;
            calculateForecast();
        });
    }

    if (sliderGeneral && inputGeneral) {
        sliderGeneral.addEventListener('input', (e) => {
            inputGeneral.value = e.target.value;
            calculateForecast();
        });
        inputGeneral.addEventListener('input', (e) => {
            sliderGeneral.value = e.target.value;
            calculateForecast();
        });
    }

    // 2. 資本支出與研發滑桿
    const sliderCapex = document.getElementById('slider-capex');
    const inputCapex = document.getElementById('input-capex');
    const sliderRnD = document.getElementById('slider-rnd');
    const inputRnD = document.getElementById('input-rnd');
    const sliderCavern = document.getElementById('slider-cavern');
    const inputCavern = document.getElementById('input-cavern');

    if (sliderCapex && inputCapex) {
        sliderCapex.addEventListener('input', (e) => { inputCapex.value = e.target.value; calculateForecast(); });
        inputCapex.addEventListener('input', (e) => { sliderCapex.value = e.target.value; calculateForecast(); });
    }

    if (sliderRnD && inputRnD) {
        sliderRnD.addEventListener('input', (e) => { inputRnD.value = e.target.value; calculateForecast(); });
        inputRnD.addEventListener('input', (e) => { sliderRnD.value = e.target.value; calculateForecast(); });
    }

    if (sliderCavern && inputCavern) {
        sliderCavern.addEventListener('input', (e) => { inputCavern.value = e.target.value; calculateForecast(); });
        inputCavern.addEventListener('input', (e) => { sliderCavern.value = e.target.value; calculateForecast(); });
    }

    // 3. 策略預設按鈕 (Presets)
    const btnPresetGoderich = document.getElementById('btnPresetGoderich');
    const btnPresetPremium = document.getElementById('btnPresetPremium');
    const btnPresetESG = document.getElementById('btnPresetESG');

    if (btnPresetGoderich) {
        btnPresetGoderich.addEventListener('click', () => {
            setDecisionValues(27.0, 53.0, 25.0, 3.0, 2.0);
        });
    }
    if (btnPresetPremium) {
        btnPresetPremium.addEventListener('click', () => {
            setDecisionValues(29.5, 58.0, 15.0, 5.0, 5.0);
        });
    }
    if (btnPresetESG) {
        btnPresetESG.addEventListener('click', () => {
            setDecisionValues(31.0, 56.0, 15.0, 10.0, 8.0);
        });
    }

    // 4. 下一年度招標決策按鈕
    const btnNextYear = document.getElementById('btnNextYear');
    if (btnNextYear) {
        btnNextYear.addEventListener('click', executeStep);
    }
}

function setDecisionValues(pHigh, pGen, capex, rnd, cavern) {
    const slHigh = document.getElementById('slider-priceHighway');
    const inHigh = document.getElementById('input-priceHighway');
    const slGen = document.getElementById('slider-priceGeneral');
    const inGen = document.getElementById('input-priceGeneral');
    const slCap = document.getElementById('slider-capex');
    const inCap = document.getElementById('input-capex');
    const slRnD = document.getElementById('slider-rnd');
    const inRnD = document.getElementById('input-rnd');
    const slCav = document.getElementById('slider-cavern');
    const inCav = document.getElementById('input-cavern');

    if (slHigh) slHigh.value = pHigh;
    if (inHigh) inHigh.value = pHigh;
    if (slGen) slGen.value = pGen;
    if (inGen) inGen.value = pGen;
    if (slCap) slCap.value = capex;
    if (inCap) inCap.value = capex;
    if (slRnD) slRnD.value = rnd;
    if (inRnD) inRnD.value = rnd;
    if (slCav) slCav.value = cavern;
    if (inCav) inCav.value = cavern;

    calculateForecast();
}

function calculateForecast() {
    const pHigh = parseFloat(document.getElementById('input-priceHighway')?.value || 28.0);
    const pGen = parseFloat(document.getElementById('input-priceGeneral')?.value || 55.0);
    const capex = parseFloat(document.getElementById('input-capex')?.value || 15.0);
    const rnd = parseFloat(document.getElementById('input-rnd')?.value || 5.0);
    const cavern = parseFloat(document.getElementById('input-cavern')?.value || 2.0);

    const estHighRev = Math.round((7000 * pHigh) / 1000);
    const estGenRev = Math.round((2200 * pGen) / 1000);
    const estTotalRev = estHighRev + estGenRev + 12.0 + cavern * 1.8;
    const estCapexRnD = capex + rnd + cavern;

    setText('previewForecastRev', `$${estTotalRev.toFixed(0)}M`);
    setText('previewForecastOutlay', `$${estCapexRnD.toFixed(0)}M`);
}

function executeStep() {
    if (sim.isGameOver) {
        openSubmitModal();
        return;
    }

    const pHigh = parseFloat(document.getElementById('input-priceHighway')?.value || 28.0);
    const pGen = parseFloat(document.getElementById('input-priceGeneral')?.value || 55.0);
    const capex = parseFloat(document.getElementById('input-capex')?.value || 15.0);
    const rnd = parseFloat(document.getElementById('input-rnd')?.value || 5.0);
    const cavern = parseFloat(document.getElementById('input-cavern')?.value || 2.0);

    sim.step({
        priceHighway: pHigh,
        priceGeneral: pGen,
        capacityCapex: capex,
        rAndDGreenSalt: rnd,
        saltCavernStorageExpansion: cavern
    });

    updateUI();

    if (sim.isGameOver) {
        setTimeout(() => {
            openSubmitModal();
        }, 800);
    }
}

function updateUI() {
    const st = sim.getCurrentStatus();
    const p = st.player;
    const m = st.market;

    // 頂部狀態列
    setText('valCurrentYear', `第 ${Math.min(st.maxYears, st.year)} 年 / 共 ${st.maxYears} 年`);
    setText('valEnterpriseValue', `$${p.enterpriseValue.toFixed(1)}M`);
    setText('valCashBalance', `$${p.cash.toFixed(1)}M`);
    setText('valDebtBalance', `$${p.debt.toFixed(1)}M`);
    setText('valPlayerRank', `#${st.playerRank}`);
    setText('valWinterSeverity', `${m.winterSeverity.toFixed(2)}x (${m.winterDescription})`);

    // 巨頭卡片渲染
    renderCompetitorCards();

    // 歷史紀錄表渲染
    renderHistoryTable();

    // 更新圖表
    updateCharts();

    // 模擬結束橫幅渲染
    renderGameBanner();

    // 按鈕狀態
    const btnNext = document.getElementById('btnNextYear');
    if (btnNext) {
        if (sim.isGameOver) {
            btnNext.innerHTML = `<i data-lucide="award" class="w-4 h-4"></i> 模擬已結算・登錄總成績`;
            btnNext.className = "w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition";
        } else {
            btnNext.innerHTML = `<i data-lucide="arrow-right" class="w-4 h-4"></i> 提交本年報價，推進至第 ${st.year + 1} 年`;
            btnNext.className = "w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition";
        }
    }

    if (window.lucide) lucide.createIcons();
}

function renderCompetitorCards() {
    const container = document.getElementById('competitorsGrid');
    if (!container) return;

    container.innerHTML = '';
    const sorted = [...sim.companies].sort((a, b) => b.enterpriseValue - a.enterpriseValue);

    sorted.forEach((c, idx) => {
        const isPlayer = c.isPlayer;
        const card = document.createElement('div');
        card.className = `p-4 rounded-xl border transition ${
            isPlayer 
            ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-sm' 
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
        }`;

        const rankBadge = idx === 0 
            ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">👑 冠軍 (#1)</span>' 
            : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">#${idx + 1}</span>`;

        card.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <div>
                    <div class="font-bold text-xs ${isPlayer ? 'text-blue-900 font-extrabold' : 'text-slate-800'}">${c.name}</div>
                    <div class="text-[10px] text-slate-500">${isPlayer ? 'Goderich 100呎鹽層優勢' : (c.strategy || '市場競爭者')}</div>
                </div>
                ${rankBadge}
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs font-mono mt-3 pt-2 border-t border-slate-100">
                <div>
                    <span class="text-[10px] text-slate-400 block font-sans">企業估值 (EV)</span>
                    <strong class="text-slate-800 font-bold">$${c.enterpriseValue.toFixed(1)}M</strong>
                </div>
                <div>
                    <span class="text-[10px] text-slate-400 block font-sans">道路鹽市佔</span>
                    <strong class="${c.marketShareHighway > 25 ? 'text-emerald-600 font-bold' : 'text-slate-700'}">${c.marketShareHighway.toFixed(1)}%</strong>
                </div>
                <div>
                    <span class="text-[10px] text-slate-400 block font-sans">道路鹽報價</span>
                    <span class="text-slate-700">$${c.priceBidHighway.toFixed(1)}/噸</span>
                </div>
                <div>
                    <span class="text-[10px] text-slate-400 block font-sans">商業鹽報價</span>
                    <span class="text-slate-700">$${c.priceBidGeneral.toFixed(1)}/噸</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    const badge = document.getElementById('tableRecordCount');
    if (!tbody) return;

    const records = sim.history.filter(h => h.year > 0).slice().reverse();
    if (badge) badge.textContent = `共 ${records.length} 筆營運紀錄`;

    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="p-4 text-center text-slate-400 font-sans italic">尚無營運數據，請點擊「提交報價」開始第一年招標競賽</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    records.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 border-b border-slate-100 transition';

        const envBadge = r.chlorideIndex >= 160 
            ? `<span class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">法規管制</span>`
            : (r.chlorideIndex >= 120 ? `<span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">中度鹽化</span>` : `<span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">水質正常</span>`);

        tr.innerHTML = `
            <td class="p-2.5 font-bold text-slate-900">第 ${r.year} 年</td>
            <td class="p-2.5 font-sans text-xs text-slate-600">${r.winterDescription}</td>
            <td class="p-2.5 text-right font-medium text-slate-700">$${r.playerPriceHighway.toFixed(1)}</td>
            <td class="p-2.5 text-right font-medium text-slate-700">$${r.playerPriceGeneral.toFixed(1)}</td>
            <td class="p-2.5 text-right font-bold text-blue-600">${r.playerMarketShareHighway.toFixed(1)}%</td>
            <td class="p-2.5 text-right font-mono text-slate-800">$${r.playerRevenue.toFixed(1)}M</td>
            <td class="p-2.5 text-right font-mono text-emerald-600 font-bold">$${r.playerNetIncome.toFixed(1)}M</td>
            <td class="p-2.5 text-right font-mono text-slate-800">$${r.playerCash.toFixed(1)}M</td>
            <td class="p-2.5 text-right font-mono font-bold text-indigo-700">$${r.playerEnterpriseValue.toFixed(1)}M (#${r.playerRank})</td>
            <td class="p-2.5 text-center font-sans">${envBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderGameBanner() {
    const banner = document.getElementById('gameStatusBanner');
    if (!banner) return;

    if (sim.isGameOver) {
        banner.classList.remove('hidden');
        if (sim.isWon) {
            banner.className = 'p-5 rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-950 shadow-sm';
            banner.innerHTML = `
                <div class="flex items-start gap-4">
                    <span class="text-3xl">🏆</span>
                    <div>
                        <h4 class="font-bold text-base text-emerald-900">恭喜！達成 IPO 估值霸主與永續創新雙贏</h4>
                        <p class="text-xs text-emerald-800 mt-1 leading-relaxed">${sim.gameOverReason}</p>
                        <div class="mt-3 flex gap-2">
                            <button onclick="openSubmitModal()" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5">
                                <i data-lucide="send" class="w-3.5 h-3.5"></i>
                                <span>登記成績至 Google 試算表</span>
                            </button>
                            <button onclick="resetSimulation()" class="px-4 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold">再次開局挑戰</button>
                            <button onclick="exportCSV()" class="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold">匯出歷史報表</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            banner.className = 'p-5 rounded-2xl border border-rose-300 bg-rose-50 text-rose-950 shadow-sm';
            banner.innerHTML = `
                <div class="flex items-start gap-4">
                    <span class="text-3xl">⚠️</span>
                    <div>
                        <h4 class="font-bold text-base text-rose-900">模擬結束：大宗商品定價陷阱或現金流挑戰</h4>
                        <p class="text-xs text-rose-800 mt-1 leading-relaxed">${sim.gameOverReason}</p>
                        <div class="text-[11px] text-rose-700 mt-2 bg-white/70 p-2.5 rounded-lg border border-rose-200">
                            💡 MIT Sloan 教授 Rebecca Henderson 與 John Sterman 洞察：在缺乏差異化的大宗商品產業中，盲目削價只會引發同業報復性跟進，導致全體產業利潤毀滅！唯有守住價格紀律、善用地理水運物流護城河、並跨入地下鹽穴高毛利儲藏事業，才能維持長期優勢！
                        </div>
                        <div class="mt-3 flex gap-2">
                            <button onclick="openSubmitModal()" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5">
                                <i data-lucide="send" class="w-3.5 h-3.5"></i>
                                <span>登記成績至 Google 試算表</span>
                            </button>
                            <button onclick="resetSimulation()" class="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow">重新調整定價策略</button>
                        </div>
                    </div>
                </div>
            `;
        }
        if (window.lucide) lucide.createIcons();
    } else {
        banner.classList.add('hidden');
    }
}

function setupCharts() {
    const lightGrid = { color: 'rgba(226, 232, 240, 0.8)', drawBorder: false };
    const lightTicks = { color: '#475569', font: { size: 10, family: 'JetBrains Mono' } };
    const commonPlugins = {
        legend: { labels: { color: '#334155', font: { size: 11, weight: '500' }, boxWidth: 12 } }
    };

    // Chart 1: 企業估值競賽
    const ctxEV = document.getElementById('chartEV')?.getContext('2d');
    if (ctxEV) {
        charts.ev = new Chart(ctxEV, {
            type: 'line',
            data: {
                labels: ['Y0'],
                datasets: [
                    { label: 'Compass Minerals', data: [580], borderColor: '#2563eb', borderWidth: 3 },
                    { label: 'Cargill Salt', data: [520], borderColor: '#f59e0b', borderWidth: 1.5, borderDash: [2, 2] },
                    { label: 'Morton Salt', data: [490], borderColor: '#10b981', borderWidth: 1.5, borderDash: [2, 2] },
                    { label: 'American Rock', data: [260], borderColor: '#ef4444', borderWidth: 1.5, borderDash: [2, 2] }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: commonPlugins,
                scales: { x: { grid: lightGrid, ticks: lightTicks }, y: { grid: lightGrid, ticks: lightTicks, title: { display: true, text: '企業估值 ($M)', font: { size: 9 } } } }
            }
        });
    }

    // Chart 2: 道路鹽報價競標走勢
    const ctxPrice = document.getElementById('chartPrice')?.getContext('2d');
    if (ctxPrice) {
        charts.price = new Chart(ctxPrice, {
            type: 'line',
            data: {
                labels: ['Y0'],
                datasets: [
                    { label: 'Compass 道路鹽報價', data: [28.0], borderColor: '#2563eb', borderWidth: 2.5 },
                    { label: 'Cargill 報價', data: [28.5], borderColor: '#f59e0b', borderWidth: 1.5 },
                    { label: 'Morton 報價', data: [29.5], borderColor: '#10b981', borderWidth: 1.5 },
                    { label: 'American 報價', data: [26.5], borderColor: '#ef4444', borderWidth: 1.5 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: commonPlugins,
                scales: { x: { grid: lightGrid, ticks: lightTicks }, y: { grid: lightGrid, ticks: lightTicks, title: { display: true, text: '報價 ($/公噸)', font: { size: 9 } } } }
            }
        });
    }

    // Chart 3: 財務營收與淨利
    const ctxFinance = document.getElementById('chartFinance')?.getContext('2d');
    if (ctxFinance) {
        charts.finance = new Chart(ctxFinance, {
            type: 'bar',
            data: {
                labels: ['Y0'],
                datasets: [
                    { label: '營業總收入 ($M)', data: [502.6], backgroundColor: '#93c5fd', yAxisID: 'y' },
                    { label: '稅後淨利 ($M)', data: [35.8], backgroundColor: '#059669', yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: commonPlugins,
                scales: {
                    x: { grid: lightGrid, ticks: lightTicks },
                    y: { type: 'linear', position: 'left', grid: lightGrid, ticks: lightTicks, title: { display: true, text: '營收 ($M)', font: { size: 9 } } },
                    y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: lightTicks, title: { display: true, text: '淨利 ($M)', font: { size: 9 } } }
                }
            }
        });
    }

    // Chart 4: 淡水鹽化生態指數與氣候
    const ctxEcology = document.getElementById('chartEcology')?.getContext('2d');
    if (ctxEcology) {
        charts.ecology = new Chart(ctxEcology, {
            type: 'line',
            data: {
                labels: ['Y0'],
                datasets: [
                    { label: '大西洋水系氯化物 (mg/L)', data: [85], borderColor: '#06b6d4', borderWidth: 2.5, tension: 0.2 },
                    { label: '法規危險門檻 (160 mg/L)', data: [160], borderColor: '#ef4444', borderWidth: 2, borderDash: [4, 4] }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: commonPlugins,
                scales: { x: { grid: lightGrid, ticks: lightTicks }, y: { grid: lightGrid, ticks: lightTicks, title: { display: true, text: '濃度 (mg/L)', font: { size: 9 } } } }
            }
        });
    }
}

function updateCharts() {
    const validHistory = sim.history.filter(h => h.year > 0);
    const labels = validHistory.map(h => `第 ${h.year} 年`);

    if (charts.ev) {
        charts.ev.data.labels = labels;
        charts.ev.data.datasets[0].data = validHistory.map(h => h.playerEnterpriseValue);
        charts.ev.data.datasets[1].data = validHistory.map(h => h.companiesSnapshot[1].enterpriseValue);
        charts.ev.data.datasets[2].data = validHistory.map(h => h.companiesSnapshot[2].enterpriseValue);
        charts.ev.data.datasets[3].data = validHistory.map(h => h.companiesSnapshot[3].enterpriseValue);
        charts.ev.update();
    }

    if (charts.price) {
        charts.price.data.labels = labels;
        charts.price.data.datasets[0].data = validHistory.map(h => h.playerPriceHighway);
        charts.price.data.datasets[1].data = validHistory.map(h => h.companiesSnapshot[1].priceBidHighway);
        charts.price.data.datasets[2].data = validHistory.map(h => h.companiesSnapshot[2].priceBidHighway);
        charts.price.data.datasets[3].data = validHistory.map(h => h.companiesSnapshot[3].priceBidHighway);
        charts.price.update();
    }

    if (charts.finance) {
        charts.finance.data.labels = labels;
        charts.finance.data.datasets[0].data = validHistory.map(h => h.playerRevenue);
        charts.finance.data.datasets[1].data = validHistory.map(h => h.playerNetIncome);
        charts.finance.update();
    }

    if (charts.ecology) {
        charts.ecology.data.labels = labels;
        charts.ecology.data.datasets[0].data = validHistory.map(h => h.chlorideIndex);
        charts.ecology.data.datasets[1].data = validHistory.map(() => 160);
        charts.ecology.update();
    }
}

function exportCSV() {
    const validHistory = sim.history.filter(h => h.year > 0);
    if (validHistory.length === 0) {
        alert('尚無營運數據可供匯出！');
        return;
    }

    let csv = 'data:text/csv;charset=utf-8,\uFEFF';
    const headers = [
        '年度', '冬季氣候', '氣候指數', '道路鹽總需求', '商業鹽總需求',
        '道路鹽報價', '商業鹽報價', '道路鹽市佔率', '商業鹽市佔率',
        '營業收入', '銷貨成本', '營業利益', '稅後淨利', '流動現金', '負債',
        '企業估值', '全美排名', '淡水鹽化指數', '法規管制狀態'
    ];
    csv += headers.join(',') + '\r\n';

    validHistory.forEach(r => {
        const row = [
            r.year,
            r.winterDescription,
            r.winterSeverity,
            r.highwayDemand,
            r.generalDemand,
            r.playerPriceHighway,
            r.playerPriceGeneral,
            r.playerMarketShareHighway + '%',
            r.playerMarketShareGeneral + '%',
            r.playerRevenue,
            r.playerCogs,
            r.playerOperatingProfit,
            r.playerNetIncome,
            r.playerCash,
            r.playerDebt,
            r.playerEnterpriseValue,
            r.playerRank,
            r.chlorideIndex,
            r.envRegulation
        ];
        csv += row.join(',') + '\r\n';
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ventures_in_Salt_Compass_Y${sim.currentYear - 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================
// Google 試算表 (Google Apps Script Webhook) 串接模組
// ==========================================

function setupGoogleSheetsModule() {
    const savedUrl = localStorage.getItem(STORAGE_KEY_WEBHOOK) || "";
    const savedClass = localStorage.getItem(STORAGE_KEY_CLASS) || "";
    const savedId = localStorage.getItem(STORAGE_KEY_ID) || "";
    const savedName = localStorage.getItem(STORAGE_KEY_NAME) || "";

    const elUrl = document.getElementById('inputWebhookUrl');
    const elClass = document.getElementById('inputClass');
    const elId = document.getElementById('inputId');
    const elName = document.getElementById('inputName');

    if (elUrl) elUrl.value = savedUrl;
    if (elClass) elClass.value = savedClass;
    if (elId) elId.value = savedId;
    if (elName) elName.value = savedName;

    const btnOpen = document.getElementById('btnOpenSubmitModal');
    if (btnOpen) btnOpen.addEventListener('click', openSubmitModal);

    const btnSubmit = document.getElementById('btnSubmitScore');
    if (btnSubmit) btnSubmit.addEventListener('click', submitToGoogleSheets);
}

function openSubmitModal() {
    const modal = document.getElementById('submitModal');
    if (!modal) return;

    const st = sim.getCurrentStatus();
    const p = st.player;

    setText('modalSummaryYear', `第 ${Math.min(st.maxYears, st.year)} 年 (${sim.isGameOver ? '挑戰已結算' : '進行中'})`);
    setText('modalSummaryEV', `$${p.enterpriseValue.toFixed(1)}M (全美 #${st.playerRank})`);
    setText('modalSummaryCash', `$${p.cash.toFixed(1)}M (負債 $${p.debt.toFixed(1)}M)`);
    setText('modalSummaryRegulation', st.market.environmentalRegulationEnacted ? "⚠️ 已生效" : "未實施管制");

    const msgEl = document.getElementById('submitResultMsg');
    if (msgEl) msgEl.innerHTML = '';

    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function closeSubmitModal() {
    const modal = document.getElementById('submitModal');
    if (modal) modal.classList.add('hidden');
}

function toggleWebhookConfig() {
    const el = document.getElementById('inputWebhookUrl');
    if (el) {
        el.focus();
        el.select();
    }
}

function submitToGoogleSheets() {
    const elUrl = document.getElementById('inputWebhookUrl');
    const elClass = document.getElementById('inputClass');
    const elId = document.getElementById('inputId');
    const elName = document.getElementById('inputName');
    const msgEl = document.getElementById('submitResultMsg');

    const webhookUrl = elUrl ? elUrl.value.trim() : "";
    const className = elClass ? elClass.value.trim() : "";
    const studentId = elId ? elId.value.trim() : "";
    const studentName = elName ? elName.value.trim() : "";

    if (!studentId || !studentName) {
        alert("請填寫「學號」與「姓名」！");
        return;
    }

    if (!webhookUrl) {
        alert("尚未填寫 Google Apps Script Webhook 網址！\n請先依據指引在 Google 試算表部署 Web 應用程式並貼上網址。");
        if (elUrl) elUrl.focus();
        return;
    }

    localStorage.setItem(STORAGE_KEY_WEBHOOK, webhookUrl);
    localStorage.setItem(STORAGE_KEY_CLASS, className);
    localStorage.setItem(STORAGE_KEY_ID, studentId);
    localStorage.setItem(STORAGE_KEY_NAME, studentName);

    const st = sim.getCurrentStatus();
    const p = st.player;
    const validHistory = sim.history.filter(h => h.year > 0);

    const yearlyLogs = validHistory.map(r => ({
        year: r.year,
        winterDescription: r.winterDescription,
        winterSeverity: r.winterSeverity,
        highwayDemand: r.highwayDemand,
        generalDemand: r.generalDemand,
        priceBidHighway: r.playerPriceHighway,
        priceBidGeneral: r.playerPriceGeneral,
        shipmentsHighway: r.playerShipmentsHighway,
        marketShareHighway: r.playerMarketShareHighway,
        shipmentsGeneral: r.playerShipmentsGeneral,
        marketShareGeneral: r.playerMarketShareGeneral,
        revenue: r.playerRevenue,
        cogs: r.playerCogs,
        operatingProfit: r.playerOperatingProfit,
        netIncome: r.playerNetIncome,
        cash: r.playerCash,
        debt: r.playerDebt,
        enterpriseValue: r.playerEnterpriseValue,
        rank: r.playerRank,
        chlorideIndex: r.chlorideIndex,
        envRegulation: r.envRegulation,
        cargillEV: r.companiesSnapshot?.[1]?.enterpriseValue ?? 0,
        mortonEV: r.companiesSnapshot?.[2]?.enterpriseValue ?? 0,
        americanEV: r.companiesSnapshot?.[3]?.enterpriseValue ?? 0
    }));

    const payload = {
        action: "submit_two_sheet_salt",
        timestamp: new Date().toISOString(),
        summary: {
            className: className || "未填寫班級",
            studentId: studentId,
            studentName: studentName,
            finalRank: st.playerRank,
            finalEnterpriseValue: p.enterpriseValue,
            finalCash: p.cash,
            finalDebt: p.debt,
            finalRevenue: p.revenue,
            cumulativeProfit: p.cumulativeProfit,
            environmentalRegulationStatus: st.market.environmentalRegulationEnacted ? "強制減鹽法規生效" : "未實施管制",
            statusResult: sim.isGameOver ? (sim.isWon ? "永續估值霸主" : "已結算") : "進行中",
            gameOverReason: sim.gameOverReason || (sim.isGameOver ? "模擬已結算" : "挑戰進行中，尚未觸發結算通知"),
            totalLoggedYears: yearlyLogs.length
        },
        yearlyLogs: yearlyLogs
    };

    msgEl.innerHTML = `<span class="text-blue-600 flex items-center justify-center gap-1.5"><svg class="animate-spin h-3.5 w-3.5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 正在將總成績與 ${yearlyLogs.length} 期營運明細同步寫入 Google 試算表...</span>`;

    fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(() => {
        msgEl.innerHTML = `<span class="text-emerald-600 font-bold">✅ 成功！排行榜與 ${yearlyLogs.length} 期營運歷程已完整寫入 Google 試算表！</span>`;
        setTimeout(() => {
            closeSubmitModal();
        }, 2500);
    })
    .catch(err => {
        msgEl.innerHTML = `<span class="text-rose-600 font-bold">❌ 傳送失敗：${err.message}，請檢查網路或 Webhook 網址。</span>`;
    });
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
