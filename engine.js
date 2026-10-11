/**
 * Ventures in Salt: Compass Minerals & Commodity Pricing Flight Simulator
 * 核心商業決策與系統動力學模擬引擎 (Business Strategy & System Dynamics Engine)
 * 
 * 參考文獻與模型來源：
 * 1. Henderson, Rebecca M., John Sterman, and Ramana Nanda. (2009)
 *    "Ventures in Salt: Compass Minerals International" MIT Sloan Case 08-064.
 * 2. Sterman, John. (2014)
 *    "Interactive web-based simulations for strategy and sustainability:
 *     The MIT Sloan LearningEdge management flight simulators, Part I"
 *     System Dynamics Review, 30(1–2), 89–121.
 * 3. Kaushal, Sujay et al. (2005)
 *    "Increased salinization of fresh water in the northeastern United States" PNAS, 102(38), 13517-13520.
 */

class SaltVenturesEngine {
    constructor() {
        this.reset();
    }

    reset(customConfig = {}) {
        this.currentYear = 1;
        this.maxYears = customConfig.maxYears || 10; // 預設 10 年 (10 個招標年度)
        this.isGameOver = false;
        this.gameOverReason = "";
        this.isWon = false;

        // ---- 1. 宏觀市場與氣候環境 (Macro Environment) ----
        // 鹽業是極端依賴冬季嚴寒與暴風雪的季節性大宗商品
        this.market = {
            // 基礎道路除冰鹽總需求 (千公噸 000 Metric Tons)，全美與加拿大約 20,000 ~ 25,000 千公噸
            baseHighwayDemand: 18000,
            currentHighwayDemand: 18000,
            
            // 基礎一般商業用鹽需求 (General Trade: 食用、水質軟化、化學工業，相對平穩)
            baseGeneralTradeDemand: 12000,
            currentGeneralTradeDemand: 12000,

            // 當年冬季氣候指數 (Winter Severity Index: 0.6 ~ 1.5)
            // 1.0 為正常冬季；1.3+ 為極端暴風雪酷寒 (需求大增)；0.7- 為暖冬 (需求驟降)
            winterSeverity: 1.0,
            winterDescription: "正常平均冬季 (Normal Winter)",

            // 基準市場參考價格 ($/Metric Ton)
            marketBasePriceHighway: 28.0,
            marketBasePriceGeneral: 55.0,

            // 淡水鹽鹼化環境衝擊累積值 (Environmental Salinization Index: mg/L)
            // PNAS 2005 研究：大西洋溪流冬季氯化物達海水 25%，正常 < 30 mg/L，> 250 mg/L 為毒害飲水
            environmentalChlorideIndex: 85, // mg/L
            environmentalRegulationEnacted: false, // 是否觸發環保強制減鹽法規
            regulationPenaltyRate: 0.0
        };

        // ---- 2. 四大鹽業公司競爭者 (Competitor Profiles) ----
        // 依據個案 Exhibit 7 & 13：Compass Minerals、Cargill Salt、Morton Salt、American Rock Salt
        this.companies = [
            {
                id: "compass",
                name: "Compass Minerals (您的公司)",
                isPlayer: true,
                // 產能配置 (千公噸)
                capacityHighway: 9300,   // Goderich (6.5M) + Cote Blanche (2.8M) 岩鹽礦
                capacityGeneral: 2600,   // Ogden 太陽能 (1.5M) + 蒸發真空鹽 (1.1M)
                cash: 55.0,              // 百萬美元 (Million USD) - IPO 前期現金流
                debt: 420.0,             // IPO 承接之歷史負債 ($420M)
                shareholderEquity: 180.0,// 股東權益淨值 ($180M)
                
                // 生產成本優勢 (Goderich 鹽層 100 呎厚，享 25% 成本領先護城河)
                unitCostHighway: 14.5,   // 每公噸開採與物流成本 ($/ton)
                unitCostGeneral: 32.0,   // 食品與高純度蒸發鹽單位成本 ($/ton)
                shippingLogisticsCost: 8.5, // 五大湖與密西西比河水運低成本優勢 ($/ton)
                
                // 創新與多角化事業 (個案提及：地下鹽穴檔案儲藏、高價值專利環保融雪劑)
                undergroundStorageRevenue: 12.0, // 鹽穴存檔租金收入 ($M)
                rAndDInvestment: 0,              // 綠色環保融雪劑研發累計

                // 當期營運數據
                priceBidHighway: 28.0,
                priceBidGeneral: 55.0,
                shipmentsHighway: 0,
                shipmentsGeneral: 0,
                revenue: 0,
                cogs: 0,
                operatingProfit: 0,
                netIncome: 0,
                marketShareHighway: 0,
                marketShareGeneral: 0,
                cumulativeProfit: 0,
                enterpriseValue: 580.0    // 企業價值 (EV, $M)
            },
            {
                id: "cargill",
                name: "Cargill Salt (嘉吉鹽業)",
                isPlayer: false,
                strategy: "scale_leader", // 跨國巨頭，產能大、價格跟隨
                capacityHighway: 7800,
                capacityGeneral: 3500,
                unitCostHighway: 17.5,
                unitCostGeneral: 35.0,
                shippingLogisticsCost: 11.0,
                cash: 120.0,
                priceBidHighway: 28.5,
                priceBidGeneral: 54.0,
                shipmentsHighway: 0,
                shipmentsGeneral: 0,
                revenue: 0,
                operatingProfit: 0,
                enterpriseValue: 520.0
            },
            {
                id: "morton",
                name: "Morton Salt (莫頓鹽業: 百年老牌)",
                isPlayer: false,
                strategy: "premium_brand", // 著重一般消費品牌溢價，道路鹽報價偏高保利潤
                capacityHighway: 6500,
                capacityGeneral: 4200,
                unitCostHighway: 18.0,
                unitCostGeneral: 33.5,
                shippingLogisticsCost: 11.5,
                cash: 95.0,
                priceBidHighway: 29.5,
                priceBidGeneral: 57.0,
                shipmentsHighway: 0,
                shipmentsGeneral: 0,
                revenue: 0,
                operatingProfit: 0,
                enterpriseValue: 490.0
            },
            {
                id: "american",
                name: "American Rock Salt (美洲岩鹽: 紐約區域激進者)",
                isPlayer: false,
                strategy: "price_cutter", // 區域新礦 (Hampton Corners)，常削價搶標
                capacityHighway: 4500,
                capacityGeneral: 500,
                unitCostHighway: 16.8,
                unitCostGeneral: 38.0,
                shippingLogisticsCost: 12.5,
                cash: 35.0,
                priceBidHighway: 26.5,
                priceBidGeneral: 52.0,
                shipmentsHighway: 0,
                shipmentsGeneral: 0,
                revenue: 0,
                operatingProfit: 0,
                enterpriseValue: 260.0
            }
        ];

        // 歷史軌跡與日誌
        this.history = [];
        this.recordHistoryInitial();
    }

    /**
     * 產生年度氣候隨機擾動 (模擬北美冬季氣候震盪與降雪量)
     */
    generateWinterWeather() {
        // 常態分佈取樣：均值 1.0，標準差 0.22
        const rand = (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 0.22;
        let severity = Math.max(0.65, Math.min(1.55, 1.0 + rand));
        severity = Math.round(severity * 100) / 100;

        let desc = "正常平均冬季 (Normal Winter)";
        if (severity >= 1.35) {
            desc = "極端暴風雪霸王寒流 (Severe Blizzard & Deep Freeze)";
        } else if (severity >= 1.15) {
            desc = "偏冷嚴冬多雪 (Colder Than Average with Heavy Snow)";
        } else if (severity <= 0.8) {
            desc = "聖嬰暖冬少雪 (El Niño Warm Winter & Low Snowfall)";
        } else if (severity < 0.95) {
            desc = "溫和輕微暖冬 (Mild Winter)";
        }

        this.market.winterSeverity = severity;
        this.market.winterDescription = desc;

        // 道路除冰鹽需求與天氣嚴重度高度正相關 (彈性約 1.1)
        this.market.currentHighwayDemand = Math.round(this.market.baseHighwayDemand * Math.pow(severity, 1.1));
        
        // 一般消費與工業鹽僅受微弱景氣影響 (±5%)
        const econShift = 1.0 + (Math.random() * 0.08 - 0.04);
        this.market.currentGeneralTradeDemand = Math.round(this.market.baseGeneralTradeDemand * econShift);
    }

    /**
     * AI 對手自動報價與策略生成 (Sterman 2014 競標賽局模型)
     */
    generateAIDecisions() {
        const severity = this.market.winterSeverity;
        const envRegulation = this.market.environmentalRegulationEnacted;

        this.companies.filter(c => !c.isPlayer).forEach(ai => {
            let baseHighway = 28.0;
            let baseGeneral = 55.0;

            if (ai.strategy === "price_cutter") {
                // 激進削價搶單型：若去年利潤尚可，更激進壓低 $1~$2 搶市場份額
                baseHighway = 26.5 + (Math.random() * 1.5 - 0.8);
                baseGeneral = 52.0 + (Math.random() * 2.0 - 1.0);
            } else if (ai.strategy === "premium_brand") {
                // 品牌高價型：保持高利潤率，不打割喉戰
                baseHighway = 29.0 + (severity > 1.1 ? 2.5 : 0.5) + (Math.random() * 1.0);
                baseGeneral = 56.5 + (Math.random() * 2.0);
            } else {
                // 嘉吉型 (跟隨市場與天氣調節)：嚴冬提價，暖冬微幅降價防庫存
                if (severity >= 1.2) {
                    baseHighway = 30.5 + (Math.random() * 1.5);
                } else if (severity <= 0.85) {
                    baseHighway = 26.8 + (Math.random() * 1.0);
                } else {
                    baseHighway = 28.2 + (Math.random() * 1.2);
                }
                baseGeneral = 54.5 + (Math.random() * 1.5);
            }

            // 若環保法規生效，AI 會小幅拉高報價轉嫁成本
            if (envRegulation) {
                baseHighway += 2.0;
            }

            ai.priceBidHighway = Math.round(baseHighway * 10) / 10;
            ai.priceBidGeneral = Math.round(baseGeneral * 10) / 10;
        });
    }

    /**
     * 多項羅吉特市場分配模型 (Multinomial Logit Market Allocation)
     * 大宗商品對價格極度敏感，低價者分得顯著較高之市佔，但受限於運輸半徑與各廠產能上限。
     */
    allocateMarketShare(bids, totalDemand, capacities, sensitivity = 0.35) {
        // 計算吸引力權重: e^(-beta * price)
        const minPrice = Math.min(...bids);
        const weights = bids.map(p => Math.exp(-sensitivity * (p - minPrice)));
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        let initialShares = weights.map(w => w / totalWeight);
        let desiredShipments = initialShares.map(s => Math.round(s * totalDemand));

        // 產能上限約束截斷
        let actualShipments = new Array(bids.length).fill(0);
        let remainingDemand = totalDemand;
        let uncappedIndices = [];

        for (let i = 0; i < bids.length; i++) {
            if (desiredShipments[i] > capacities[i]) {
                actualShipments[i] = capacities[i];
                remainingDemand -= capacities[i];
            } else {
                uncappedIndices.push(i);
            }
        }

        // 若有未滿載業者，平攤剩餘未滿足需求
        if (uncappedIndices.length > 0 && remainingDemand > 0) {
            const subWeight = uncappedIndices.reduce((acc, idx) => acc + weights[idx], 0);
            uncappedIndices.forEach(idx => {
                const add = Math.min(capacities[idx] - actualShipments[idx], Math.round(remainingDemand * (weights[idx] / subWeight)));
                actualShipments[idx] += add;
            });
        }

        const finalShares = actualShipments.map(s => totalDemand > 0 ? (s / totalDemand) : 0);
        return { shipments: actualShipments, shares: finalShares };
    }

    /**
     * 執行一年商業營運與競標結算
     * @param {Object} playerDecisions 玩家決策 { priceHighway, priceGeneral, capacityCapex, rAndDGreenSalt, saltCavernStorageExpansion }
     */
    step(playerDecisions) {
        if (this.isGameOver) return;

        const player = this.companies.find(c => c.isPlayer);

        // 1. 套用玩家決策變數
        player.priceBidHighway = Math.max(15.0, Math.min(60.0, parseFloat(playerDecisions.priceHighway || 28.0)));
        player.priceBidGeneral = Math.max(30.0, Math.min(100.0, parseFloat(playerDecisions.priceGeneral || 55.0)));
        
        // 資本支出決策 (產能擴充 / 維護 Capex, $M)
        const capex = Math.max(0, parseFloat(playerDecisions.capacityCapex || 15.0));
        // 綠色環保低腐蝕融雪劑研發投入 ($M)
        const greenRnD = Math.max(0, parseFloat(playerDecisions.rAndDGreenSalt || 5.0));
        // 地下鹽穴儲藏業務擴展 ($M)
        const cavernInvest = Math.max(0, parseFloat(playerDecisions.saltCavernStorageExpansion || 2.0));

        player.rAndDInvestment += greenRnD;
        if (cavernInvest > 0) {
            player.undergroundStorageRevenue += cavernInvest * 1.8; // 鹽穴檔案儲藏具穩定年租金回報
        }
        // 資本支出擴充 Goderich 與 Ogden 產能 (每 $10M Capex 增加 250 千公噸產能)
        if (capex > 20) {
            player.capacityHighway += Math.round((capex - 20) * 20);
        }

        // 2. 隨機生成當年冬季氣候
        this.generateWinterWeather();

        // 3. 觸發 AI 對手競標策略
        this.generateAIDecisions();

        // 4. 計算道路除冰鹽市場分配 (Highway Deicing)
        const highwayBids = this.companies.map(c => c.priceBidHighway);
        const highwayCaps = this.companies.map(c => c.capacityHighway);
        const highwayAlloc = this.allocateMarketShare(highwayBids, this.market.currentHighwayDemand, highwayCaps, 0.40);

        // 5. 計算一般商業用鹽市場分配 (General Trade)
        const generalBids = this.companies.map(c => c.priceBidGeneral);
        const generalCaps = this.companies.map(c => c.capacityGeneral);
        const generalAlloc = this.allocateMarketShare(generalBids, this.market.currentGeneralTradeDemand, generalCaps, 0.25);

        // 6. 各公司財務結算 (損益表與現金流)
        let totalHighwaySaltUsed = 0;

        this.companies.forEach((c, idx) => {
            c.shipmentsHighway = highwayAlloc.shipments[idx];
            c.marketShareHighway = Math.round(highwayAlloc.shares[idx] * 1000) / 10; // 百分比

            c.shipmentsGeneral = generalAlloc.shipments[idx];
            c.marketShareGeneral = Math.round(generalAlloc.shares[idx] * 1000) / 10;

            totalHighwaySaltUsed += c.shipmentsHighway;

            // 營業收入 ($M)
            const revHighway = (c.shipmentsHighway * c.priceBidHighway) / 1000;
            const revGeneral = (c.shipmentsGeneral * c.priceBidGeneral) / 1000;
            let otherRev = 0;
            if (c.isPlayer) {
                otherRev = c.undergroundStorageRevenue; // 鹽穴檔案/核廢存儲租金
            }
            c.revenue = Math.round((revHighway + revGeneral + otherRev) * 10) / 10;

            // 銷貨成本 COGS (生產 + 運輸物流)
            const cogsHighway = (c.shipmentsHighway * (c.unitCostHighway + c.shippingLogisticsCost)) / 1000;
            const cogsGeneral = (c.shipmentsGeneral * (c.unitCostGeneral + c.shippingLogisticsCost * 0.8)) / 1000;
            c.cogs = Math.round((cogsHighway + cogsGeneral) * 10) / 10;

            // 營業費用 (SG&A、折舊與研發)
            const sga = Math.round(c.revenue * 0.08 * 10) / 10;
            const depreciation = 28.0;
            const rndExpense = c.isPlayer ? greenRnD : 2.0;
            const currentCapex = c.isPlayer ? capex : 16.0;

            // 營業利益 (EBIT)
            c.operatingProfit = Math.round((c.revenue - c.cogs - sga - depreciation - rndExpense) * 10) / 10;

            // 利息與稅金 (負債利息約 6.5%)
            let interest = 0;
            if (c.isPlayer) {
                interest = Math.round(c.debt * 0.065 * 10) / 10;
            }
            const ebt = c.operatingProfit - interest;
            const tax = ebt > 0 ? Math.round(ebt * 0.32 * 10) / 10 : 0;
            c.netIncome = Math.round((ebt - tax) * 10) / 10;
            c.cumulativeProfit += c.netIncome;

            // 現金流計算 (Operating Cash Flow - Capex - 債務償還)
            if (c.isPlayer) {
                const opCashFlow = c.netIncome + depreciation - 5.0; // 營運現金流
                const debtPayment = Math.min(c.debt, 20.0); // 每年償還部分舊債
                c.debt -= debtPayment;
                c.cash += Math.round((opCashFlow - currentCapex - debtPayment) * 10) / 10;
                c.shareholderEquity += c.netIncome;

                // 企業估值 (Enterprise Value, EV): 基於 EBITDA 8.5 倍乘數 - 淨負債
                const ebitda = c.operatingProfit + depreciation;
                const ev = (ebitda * 8.5) - c.debt + c.cash;
                c.enterpriseValue = Math.max(100.0, Math.round(ev * 10) / 10);
            } else {
                c.cash += Math.round((c.netIncome * 0.6) * 10) / 10;
                const ebitda = c.operatingProfit + depreciation;
                c.enterpriseValue = Math.max(100.0, Math.round((ebitda * 8.0) * 10) / 10);
            }
        });

        // 7. 系統動力學：淡水鹽鹼化環境累積與法規反饋 (Kaushal 2005)
        // 每年路鹽隨融雪滲入地下水與流域，使氯化物濃度持續攀升
        const environmentalAddedChloride = Math.round((totalHighwaySaltUsed / 18000) * 14);
        // 玩家研發之綠色環保低腐蝕融雪劑可緩解鹽化濃度上升
        const greenMitigation = Math.min(10, Math.round(player.rAndDInvestment * 0.25));
        this.market.environmentalChlorideIndex += Math.max(2, environmentalAddedChloride - greenMitigation);

        // 若大西洋流域氯化物濃度超過 160 mg/L (達到海水 20% 嚴重毒害門檻)，引發政府監管法規！
        if (this.market.environmentalChlorideIndex >= 160 && !this.market.environmentalRegulationEnacted) {
            this.market.environmentalRegulationEnacted = true;
            this.market.regulationPenaltyRate = 0.20; // 強制削減 20% 傳統公路散鹽施用量
        }

        // 8. 判定模擬勝負與經營危機
        const sorted = [...this.companies].sort((a, b) => b.enterpriseValue - a.enterpriseValue);
        const playerRank = sorted.findIndex(c => c.id === "compass") + 1;

        if (player.cash < -50.0) {
            this.isGameOver = true;
            this.isWon = false;
            this.gameOverReason = `【流動性危機宣告重整】在第 ${this.currentYear} 年，因大宗商品割喉價格戰或過度盲目資本擴張，公司現金虧損達 $${player.cash}M，高額債務利息壓垮了現金流，被迫由私募股權接管清算！`;
        } else if (this.currentYear >= this.maxYears) {
            this.isGameOver = true;
            this.isWon = (playerRank === 1) && (player.cash > 20.0);

            if (this.isWon) {
                this.gameOverReason = `【成功完成 IPO 並躍居鹽業霸主！】在歷經 ${this.maxYears} 年的激烈市場競標與極端氣候考驗中，您帶領 Compass Minerals 以企業價值 $${player.enterpriseValue}M 榮登全美第一名！且成功開拓了鹽穴存檔高毛利新事業，完美兼顧了定價利潤與永續責任！`;
            } else {
                this.gameOverReason = `【完成 ${this.maxYears} 年營運考驗】您的企業估值為 $${player.enterpriseValue}M（排名第 ${playerRank} 名，現金結餘 $${player.cash}M）。面對大宗商品的價格戰與氣候波動，您成功維持了業務運轉，但在定價紀律與多角化避險上仍有進一步優化空間。`;
            }
        }

        // 9. 記錄年度營運紀錄歷史
        this.recordHistory();

        // 推進年度
        this.currentYear++;
    }

    recordHistoryInitial() {
        const player = this.companies[0];
        this.history.push({
            year: 0,
            winterSeverity: 1.0,
            winterDescription: "基準年 (IPO 基準期)",
            highwayDemand: this.market.baseHighwayDemand,
            generalDemand: this.market.baseGeneralTradeDemand,
            chlorideIndex: this.market.environmentalChlorideIndex,
            envRegulation: "未實施管制",

            // 玩家決策與狀態
            playerPriceHighway: player.priceBidHighway,
            playerPriceGeneral: player.priceBidGeneral,
            playerShipmentsHighway: 0,
            playerShipmentsGeneral: 0,
            playerRevenue: 502.6, // 個案 Exhibit 11 2002 實際營收
            playerOperatingProfit: 77.6,
            playerNetIncome: 35.8,
            playerCash: player.cash,
            playerDebt: player.debt,
            playerEnterpriseValue: player.enterpriseValue,
            playerRank: 1,

            // 全行業出貨與對手
            companiesSnapshot: JSON.parse(JSON.stringify(this.companies))
        });
    }

    recordHistory() {
        const player = this.companies.find(c => c.isPlayer);
        const sorted = [...this.companies].sort((a, b) => b.enterpriseValue - a.enterpriseValue);
        const playerRank = sorted.findIndex(c => c.id === "compass") + 1;

        const record = {
            year: this.currentYear,
            // 宏觀環境與生態
            winterSeverity: this.market.winterSeverity,
            winterDescription: this.market.winterDescription,
            highwayDemand: this.market.currentHighwayDemand,
            generalDemand: this.market.currentGeneralTradeDemand,
            chlorideIndex: this.market.environmentalChlorideIndex,
            envRegulation: this.market.environmentalRegulationEnacted ? "⚠️ 強制減鹽法規生效" : "未實施管制",

            // 玩家決策變數
            playerPriceHighway: player.priceBidHighway,
            playerPriceGeneral: player.priceBidGeneral,

            // 玩家營運紀錄表財務數據 (Financials)
            playerShipmentsHighway: player.shipmentsHighway,
            playerShipmentsGeneral: player.shipmentsGeneral,
            playerMarketShareHighway: player.marketShareHighway,
            playerMarketShareGeneral: player.marketShareGeneral,
            playerRevenue: player.revenue,
            playerCogs: player.cogs,
            playerOperatingProfit: player.operatingProfit,
            playerNetIncome: player.netIncome,
            playerCash: player.cash,
            playerDebt: player.debt,
            playerEnterpriseValue: player.enterpriseValue,
            playerRank: playerRank,

            // 四大巨頭競爭快照
            companiesSnapshot: JSON.parse(JSON.stringify(this.companies))
        };

        this.history.push(record);
    }

    getCurrentStatus() {
        const player = this.companies.find(c => c.isPlayer);
        const sorted = [...this.companies].sort((a, b) => b.enterpriseValue - a.enterpriseValue);
        const playerRank = sorted.findIndex(c => c.id === "compass") + 1;

        return {
            year: this.currentYear,
            maxYears: this.maxYears,
            market: this.market,
            companies: this.companies,
            player: player,
            playerRank: playerRank,
            isGameOver: this.isGameOver,
            isWon: this.isWon,
            gameOverReason: this.gameOverReason
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaltVenturesEngine;
}
