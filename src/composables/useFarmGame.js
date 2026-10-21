import { ref } from 'vue';
import farmApi, { CROPS } from './useFarmApi.js';
import farmAudio from './useAudio.js';

/**
 * 农场游戏状态与操作封装。
 * 所有数据读写都走 farmApi（mock/后端），本层只负责响应式状态 + 音效 + 提示。
 */
export function useFarmGame(openId) {
  const day = ref(1);
  const coins = ref(0);
  const plots = ref([]);
  const seeds = ref({});
  const crops = ref({});
  const catalog = ref(CROPS);
  const leaderboard = ref([]);
  const selectedSeed = ref('');
  const message = ref('');
  const loading = ref(false);
  let msgTimer = null;

  const cropById = (id) => catalog.value.find((c) => c.cropId === id);

  const showMsg = (text) => {
    message.value = text;
    if (msgTimer) clearTimeout(msgTimer);
    msgTimer = setTimeout(() => {
      message.value = '';
    }, 1800);
  };

  const applyState = (data) => {
    if (!data) return;
    day.value = data.day;
    coins.value = data.coins;
    plots.value = data.plots || [];
    seeds.value = data.seeds || {};
    crops.value = data.crops || {};
  };

  const load = async () => {
    loading.value = true;
    const [stateRes, catalogRes] = await Promise.all([
      farmApi.getState(openId),
      farmApi.getCatalog(),
    ]);
    if (stateRes.code === 0) applyState(stateRes.data);
    if (catalogRes.code === 0) catalog.value = catalogRes.data;
    loading.value = false;
  };

  const refreshLeaderboard = async () => {
    const res = await farmApi.getLeaderboard(openId);
    if (res.code === 0) leaderboard.value = res.data;
  };

  const isReady = (plot) => {
    if (plot.state !== 'planted') return false;
    const crop = cropById(plot.cropId);
    return !!crop && plot.growth >= crop.growDays;
  };

  const tapPlot = async (index) => {
    const plot = plots.value[index];
    if (!plot) return;
    let res;
    if (plot.state === 'raw') {
      res = await farmApi.tillPlot(openId, index);
      if (res.code === 0) farmAudio.playSfx('till');
    } else if (plot.state === 'tilled') {
      if (!selectedSeed.value) {
        showMsg('先在背包里选择要种的种子');
        farmAudio.playSfx('error');
        return;
      }
      res = await farmApi.plantSeed(openId, index, selectedSeed.value);
      if (res.code === 0) farmAudio.playSfx('plant');
    } else if (plot.state === 'planted') {
      if (isReady(plot)) {
        res = await farmApi.harvestPlot(openId, index);
        if (res.code === 0) farmAudio.playSfx('harvest');
      } else if (!plot.wateredToday) {
        res = await farmApi.waterPlot(openId, index);
        if (res.code === 0) farmAudio.playSfx('water');
      } else {
        showMsg('今天浇过水啦，睡一觉明天再长');
        farmAudio.playSfx('error');
        return;
      }
    }
    if (res && res.code === 0) {
      applyState(res.data);
    } else if (res) {
      showMsg(res.msg);
      farmAudio.playSfx('error');
    }
  };

  const endDay = async () => {
    farmAudio.playSfx('sleep');
    const res = await farmApi.endDay(openId);
    if (res.code === 0) {
      applyState(res.data);
      showMsg('第 ' + res.data.day + ' 天开始了');
    } else {
      showMsg(res.msg);
    }
  };

  const buy = async (cropId, qty) => {
    const res = await farmApi.buySeed(openId, cropId, qty || 1);
    if (res.code === 0) {
      applyState(res.data);
      farmAudio.playSfx('coin');
      showMsg('购买成功');
    } else {
      showMsg(res.msg);
      farmAudio.playSfx('error');
    }
  };

  const sell = async (cropId, qty) => {
    const res = await farmApi.sellCrop(openId, cropId, qty || 1);
    if (res.code === 0) {
      applyState(res.data);
      farmAudio.playSfx('coin');
      showMsg('卖出成功');
    } else {
      showMsg(res.msg);
      farmAudio.playSfx('error');
    }
  };

  const selectSeed = (cropId) => {
    selectedSeed.value = cropId;
    farmAudio.playSfx('click');
  };

  const plotEmoji = (plot) => {
    if (plot.state === 'raw') return '🟫';
    if (plot.state === 'tilled') return '🟤';
    const crop = cropById(plot.cropId);
    if (!crop) return '🟤';
    if (isReady(plot)) return crop.emoji;
    return plot.growth < crop.growDays / 2 ? '🌱' : '🌿';
  };

  const seedCount = (id) => seeds.value[id] || 0;
  const cropCount = (id) => crops.value[id] || 0;

  return {
    day,
    coins,
    plots,
    seeds,
    crops,
    catalog,
    leaderboard,
    selectedSeed,
    message,
    loading,
    load,
    tapPlot,
    endDay,
    buy,
    sell,
    selectSeed,
    refreshLeaderboard,
    isReady,
    plotEmoji,
    seedCount,
    cropCount,
    showMsg,
  };
}

export default useFarmGame;
