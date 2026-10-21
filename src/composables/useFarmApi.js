/**
 * 农场游戏数据层。
 *
 * 【接口契约】（前端与后端约定的路径/入参/出参，后端实现时按此对齐）
 *   GET  /farm/state?openId=            -> { code:0, data: FarmState }
 *   POST /farm/plot/till   {openId, plotIndex}
 *   POST /farm/plot/plant  {openId, plotIndex, cropId}
 *   POST /farm/plot/water  {openId, plotIndex}
 *   POST /farm/plot/harvest{openId, plotIndex}
 *   POST /farm/day/end     {openId}
 *   POST /farm/shop/buy    {openId, cropId, qty}
 *   POST /farm/shop/sell   {openId, cropId, qty}
 *   GET  /farm/shop/catalog             -> { code:0, data: CatalogItem[] }
 *   GET  /farm/leaderboard?openId=      -> { code:0, data: RankItem[] }
 *   统一出参: { code: 0 成功 / 非0 失败, data, msg }
 *
 * 【当前实现】USE_MOCK = true，用 localStorage 模拟后端（按 openId 隔离存档）。
 * 将来接真后端：把 USE_MOCK 置为 false，并在每个方法里改为 fetch/axios 调用上述契约即可，
 * 上层（useFarmGame / FarmPage）无需改动。
 */

const USE_MOCK = true;

// ===== 作物配置（种子价 / 售价 / 生长天数 / emoji） =====
export const CROPS = [
  { cropId: 'carrot', name: '胡萝卜', emoji: '🥕', seedCost: 10, sellPrice: 25, growDays: 2 },
  { cropId: 'tomato', name: '番茄', emoji: '🍅', seedCost: 20, sellPrice: 50, growDays: 3 },
  { cropId: 'corn', name: '玉米', emoji: '🌽', seedCost: 35, sellPrice: 90, growDays: 4 },
  { cropId: 'pumpkin', name: '南瓜', emoji: '🎃', seedCost: 60, sellPrice: 160, growDays: 5 },
  { cropId: 'watermelon', name: '西瓜', emoji: '🍉', seedCost: 100, sellPrice: 280, growDays: 6 },
];

export const PLOT_COUNT = 9; // 3x3 农田
export const INITIAL_COINS = 50;

const cropById = (cropId) => CROPS.find((c) => c.cropId === cropId);

// ===== mock 存储 =====
const stateKey = (openId) => `farm_state_${openId || 'guest'}`;
const LB_KEY = 'farm_leaderboard_base';

const newPlot = (index) => ({ index, state: 'raw', cropId: null, growth: 0, wateredToday: false });

const defaultState = () => ({
  day: 1,
  coins: INITIAL_COINS,
  plots: Array.from({ length: PLOT_COUNT }, (_, i) => newPlot(i)),
  seeds: { carrot: 2 }, // 初始送 2 个胡萝卜种子
  crops: {},
  bestDayIncome: 0,
  unlockedCrops: [],
});

const loadState = (openId) => {
  try {
    const raw = localStorage.getItem(stateKey(openId));
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // 兜底：补齐缺失字段
    const base = defaultState();
    return { ...base, ...parsed, plots: parsed.plots && parsed.plots.length ? parsed.plots : base.plots };
  } catch (e) {
    return defaultState();
  }
};

const saveState = (openId, state) => {
  localStorage.setItem(stateKey(openId), JSON.stringify(state));
};

const ok = (data) => ({ code: 0, data, msg: 'ok' });
const fail = (msg) => ({ code: 1, data: null, msg });

// 记录解锁作物
const markUnlocked = (state, cropId) => {
  if (!state.unlockedCrops.includes(cropId)) state.unlockedCrops.push(cropId);
};

// 计算总资产（金币 + 库存种子/作物折算）
const totalAssets = (state) => {
  let assets = state.coins;
  Object.entries(state.seeds || {}).forEach(([cropId, qty]) => {
    const c = cropById(cropId);
    if (c) assets += c.seedCost * qty;
  });
  Object.entries(state.crops || {}).forEach(([cropId, qty]) => {
    const c = cropById(cropId);
    if (c) assets += c.sellPrice * qty;
  });
  return assets;
};

// ===== mock 排行榜基础数据（假玩家） =====
const baseLeaderboard = () => {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  const base = [
    { name: '小镇农夫', totalAssets: 1200, bestDayIncome: 300, unlockedCrops: 5 },
    { name: '牧场新手', totalAssets: 600, bestDayIncome: 150, unlockedCrops: 3 },
    { name: '种田达人', totalAssets: 300, bestDayIncome: 90, unlockedCrops: 2 },
  ];
  localStorage.setItem(LB_KEY, JSON.stringify(base));
  return base;
};

// ===== 对外 API（mock 实现） =====
export const farmApi = {
  async getState(openId) {
    if (!USE_MOCK) { /* TODO: fetch GET /farm/state?openId= */ }
    return ok(loadState(openId));
  },

  async tillPlot(openId, plotIndex) {
    if (!USE_MOCK) { /* TODO: fetch POST /farm/plot/till */ }
    const state = loadState(openId);
    const plot = state.plots[plotIndex];
    if (!plot) return fail('地块不存在');
    if (plot.state !== 'raw') return fail('该地块已开垦');
    plot.state = 'tilled';
    saveState(openId, state);
    return ok(state);
  },

  async plantSeed(openId, plotIndex, cropId) {
    if (!USE_MOCK) { /* TODO: fetch POST /farm/plot/plant */ }
    const state = loadState(openId);
    const plot = state.plots[plotIndex];
    const crop = cropById(cropId);
    if (!plot || !crop) return fail('参数错误');
    if (plot.state !== 'tilled') return fail('需要先开垦土地');
    if ((state.seeds[cropId] || 0) <= 0) return fail('种子不足，去商店购买');
    state.seeds[cropId] -= 1;
    plot.state = 'planted';
    plot.cropId = cropId;
    plot.growth = 0;
    plot.wateredToday = false;
    markUnlocked(state, cropId);
    saveState(openId, state);
    return ok(state);
  },

  async waterPlot(openId, plotIndex) {
    if (!USE_MOCK) { /* TODO: fetch POST /farm/plot/water */ }
    const state = loadState(openId);
    const plot = state.plots[plotIndex];
    if (!plot) return fail('地块不存在');
    if (plot.state !== 'planted') return fail('这里没有作物');
    const crop = cropById(plot.cropId);
    if (crop && plot.growth >= crop.growDays) return fail('作物已成熟，请收获');
    if (plot.wateredToday) return fail('今天已经浇过水了');
    plot.wateredToday = true;
    saveState(openId, state);
    return ok(state);
  },

  async harvestPlot(openId, plotIndex) {
    if (!USE_MOCK) { /* TODO: fetch POST /farm/plot/harvest */ }
    const state = loadState(openId);
    const plot = state.plots[plotIndex];
    if (!plot || plot.state !== 'planted') return fail('这里没有可收获的作物');
    const crop = cropById(plot.cropId);
    if (!crop || plot.growth < crop.growDays) return fail('作物还没成熟');
    state.crops[plot.cropId] = (state.crops[plot.cropId] || 0) + 1;
    plot.state = 'tilled';
    plot.cropId = null;
    plot.growth = 0;
    plot.wateredToday = false;
    saveState(openId, state);
    return ok(state);
  },

  async endDay(openId) {
    if (!USE_MOCK) { /* TODO: fetch POST /farm/day/end */ }
    const state = loadState(openId);
    let incomeToday = 0; // 简化：睡觉不产生收入，收入来自卖作物；此处保留字段
    state.plots.forEach((plot) => {
      if (plot.state === 'planted') {
        const crop = cropById(plot.cropId);
        if (crop && plot.growth < crop.growDays && plot.wateredToday) {
          plot.growth += 1;
        }
        plot.wateredToday = false;
      }
    });
    state.day += 1;
    if (incomeToday > state.bestDayIncome) state.bestDayIncome = incomeToday;
    saveState(openId, state);
    return ok(state);
  },

  async buySeed(openId, cropId, qty = 1) {
    if (!USE_MOCK) { /* TODO: fetch POST /farm/shop/buy */ }
    const state = loadState(openId);
    const crop = cropById(cropId);
    if (!crop) return fail('商品不存在');
    const cost = crop.seedCost * qty;
    if (state.coins < cost) return fail('金币不足');
    state.coins -= cost;
    state.seeds[cropId] = (state.seeds[cropId] || 0) + qty;
    saveState(openId, state);
    return ok(state);
  },

  async sellCrop(openId, cropId, qty = 1) {
    if (!USE_MOCK) { /* TODO: fetch POST /farm/shop/sell */ }
    const state = loadState(openId);
    const crop = cropById(cropId);
    if (!crop) return fail('商品不存在');
    if ((state.crops[cropId] || 0) < qty) return fail('作物不足');
    const gain = crop.sellPrice * qty;
    state.crops[cropId] -= qty;
    state.coins += gain;
    if (gain > state.bestDayIncome) state.bestDayIncome = gain;
    saveState(openId, state);
    return ok(state);
  },

  async getCatalog() {
    if (!USE_MOCK) { /* TODO: fetch GET /farm/shop/catalog */ }
    return ok(CROPS);
  },

  async getLeaderboard(openId) {
    if (!USE_MOCK) { /* TODO: fetch GET /farm/leaderboard?openId= */ }
    const state = loadState(openId);
    const me = {
      name: '我',
      isMe: true,
      totalAssets: totalAssets(state),
      bestDayIncome: state.bestDayIncome,
      unlockedCrops: state.unlockedCrops.length,
    };
    const list = [...baseLeaderboard(), me].sort((a, b) => b.totalAssets - a.totalAssets);
    return ok(list);
  },
};

export default farmApi;
