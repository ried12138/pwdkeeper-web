<template>
  <div class="farm-page">
    <!-- 顶部 HUD -->
    <div class="hud">
      <div class="hud-left">
        <span class="hud-day">🌞 第 {{ game.day.value }} 天</span>
        <span class="hud-coin">🪙 {{ game.coins.value }}</span>
      </div>
      <div class="hud-right">
        <button class="hud-btn" @click="openModal('backpack')">🎒 背包</button>
        <button class="hud-btn" @click="openModal('shop')">🏪 商店</button>
        <button class="hud-btn" @click="openModal('rank')">🏆 排行</button>
        <button class="hud-btn" @click="toggleMusic">{{ muted ? '🔇' : '🔊' }}</button>
      </div>
    </div>

    <!-- 当前选中种子提示 -->
    <div class="seed-bar">
      <span v-if="game.selectedSeed.value">
        当前种子：{{ seedName(game.selectedSeed.value) }} ×{{ game.seedCount(game.selectedSeed.value) }}
      </span>
      <span v-else>点背包选种子 → 点地块种植</span>
    </div>

    <!-- 农田 3x3 -->
    <div class="farm-grid">
      <div
        v-for="(plot, i) in game.plots.value"
        :key="i"
        class="plot"
        :class="{ ready: game.isReady(plot) }"
        @click="game.tapPlot(i)"
      >
        <span class="plot-emoji">{{ game.plotEmoji(plot) }}</span>
        <span v-if="plot.state === 'planted' && plot.wateredToday && !game.isReady(plot)" class="plot-badge water">💧</span>
        <span v-if="game.isReady(plot)" class="plot-badge ready-tag">收!</span>
      </div>
    </div>

    <p class="tip">点地块自动：开垦→播种→浇水→收获</p>

    <!-- 结束今天 -->
    <button class="sleep-btn" @click="game.endDay()">😴 睡觉 · 结束今天</button>

    <!-- 提示条 -->
    <transition name="toast-fade">
      <div v-if="game.message.value" class="farm-toast">{{ game.message.value }}</div>
    </transition>

    <!-- 背包 -->
    <div v-if="modal === 'backpack'" class="modal" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-head">🎒 背包 <span class="modal-close" @click="closeModal">×</span></div>
        <div class="modal-body">
          <h4>种子（点击选择用于播种）</h4>
          <div v-for="c in game.catalog.value" :key="c.cropId" class="inv-row" @click="game.selectSeed(c.cropId)">
            <span>{{ c.emoji }} {{ c.name }}</span>
            <span class="inv-count">×{{ game.seedCount(c.cropId) }}</span>
            <span v-if="game.selectedSeed.value === c.cropId" class="inv-sel">已选</span>
          </div>
          <h4>作物（去商店卖出）</h4>
          <div v-for="c in game.catalog.value" :key="'c' + c.cropId" class="inv-row">
            <span>{{ c.emoji }} {{ c.name }}</span>
            <span class="inv-count">×{{ game.cropCount(c.cropId) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 商店 -->
    <div v-if="modal === 'shop'" class="modal" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-head">🏪 商店（🪙 {{ game.coins.value }}） <span class="modal-close" @click="closeModal">×</span></div>
        <div class="modal-body">
          <h4>买种子</h4>
          <div v-for="c in game.catalog.value" :key="'b' + c.cropId" class="shop-row">
            <span>{{ c.emoji }} {{ c.name }}（{{ c.growDays }}天）</span>
            <button class="shop-btn" @click="game.buy(c.cropId, 1)">🪙{{ c.seedCost }} 买</button>
          </div>
          <h4>卖作物</h4>
          <div v-for="c in game.catalog.value" :key="'s' + c.cropId" class="shop-row">
            <span>{{ c.emoji }} {{ c.name }} ×{{ game.cropCount(c.cropId) }}</span>
            <button class="shop-btn sell" :disabled="game.cropCount(c.cropId) <= 0" @click="game.sell(c.cropId, 1)">卖 🪙{{ c.sellPrice }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 排行榜 -->
    <div v-if="modal === 'rank'" class="modal" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-head">🏆 排行榜 <span class="modal-close" @click="closeModal">×</span></div>
        <div class="modal-body">
          <div v-for="(p, i) in game.leaderboard.value" :key="i" class="rank-row" :class="{ me: p.isMe }">
            <span class="rank-no">{{ i + 1 }}</span>
            <span class="rank-name">{{ p.name }}</span>
            <span class="rank-asset">🪙{{ p.totalAssets }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useFarmGame } from '../composables/useFarmGame.js';
import farmAudio from '../composables/useAudio.js';

const route = useRoute();
const openId = route.query.openId || new URLSearchParams(window.location.search).get('openId') || 'guest';

const game = useFarmGame(openId);
const modal = ref('');
const muted = ref(farmAudio.isMuted());

const seedName = (id) => {
  const c = game.catalog.value.find((x) => x.cropId === id);
  return c ? c.name : id;
};

const openModal = (name) => {
  farmAudio.playSfx('click');
  modal.value = name;
  if (name === 'rank') game.refreshLeaderboard();
};
const closeModal = () => {
  modal.value = '';
};

const toggleMusic = () => {
  muted.value = !muted.value;
  farmAudio.setMuted(muted.value);
};

// 首次用户手势解锁音频并播放 BGM
const unlockAudio = () => {
  farmAudio.ensure();
  if (!farmAudio.isMuted()) farmAudio.startBgm();
  window.removeEventListener('pointerdown', unlockAudio);
};

onMounted(() => {
  game.load();
  window.addEventListener('pointerdown', unlockAudio);
});

onUnmounted(() => {
  window.removeEventListener('pointerdown', unlockAudio);
  farmAudio.stopBgm();
});
</script>

<style scoped>
.farm-page {
  max-width: 480px;
  margin: 0 auto;
  padding: 12px;
  box-sizing: border-box;
  text-align: center;
  color: #fff;
}

.hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  background: #2a2a2a;
  border-radius: 12px;
  padding: 8px 10px;
}

.hud-left, .hud-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.hud-day, .hud-coin {
  font-size: 15px;
  font-weight: 600;
}

.hud-btn {
  padding: 6px 8px;
  font-size: 13px;
  min-width: auto;
  border-radius: 8px;
}

.seed-bar {
  margin: 10px 0;
  font-size: 14px;
  color: #ffd76e;
}

.farm-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.plot {
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #7ec850, #5aa53a);
  border-radius: 14px;
  box-shadow: inset 0 -4px 0 rgba(0,0,0,0.15);
  cursor: pointer;
  user-select: none;
  transition: transform 0.1s ease;
}

.plot:active {
  transform: scale(0.95);
}

.plot.ready {
  background: linear-gradient(145deg, #ffe08a, #f7c948);
  animation: bounce 1s infinite;
}

.plot-emoji {
  font-size: 40px;
  line-height: 1;
}

.plot-badge {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 14px;
}

.ready-tag {
  background: #ff6b6b;
  color: #fff;
  border-radius: 8px;
  padding: 1px 5px;
  font-size: 12px;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.tip {
  margin: 10px 0;
  font-size: 12px;
  color: #aaa;
}

.sleep-btn {
  width: 100%;
  padding: 14px;
  font-size: 17px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(to right, #6a5acd, #8a7bf0);
}

/* 提示条：屏幕中上方 */
.farm-toast {
  position: fixed;
  left: 50%;
  top: 35%;
  transform: translate(-50%, -50%);
  padding: 12px 24px;
  background: rgba(0,0,0,0.8);
  color: #fff;
  border-radius: 24px;
  font-size: 15px;
  z-index: 999;
}

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: opacity 0.3s ease;
}
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
}

/* 弹窗 */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal-card {
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  background: #232323;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-head {
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  background: #2e2e2e;
}

.modal-close {
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
}

.modal-body {
  padding: 12px 16px;
  overflow-y: auto;
  text-align: left;
}

.modal-body h4 {
  margin: 10px 0 6px;
  font-size: 14px;
  color: #ffd76e;
}

.inv-row, .shop-row, .rank-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #2c2c2c;
  margin-bottom: 6px;
  font-size: 14px;
}

.inv-row {
  cursor: pointer;
}

.inv-count { color: #9ad19a; }
.inv-sel { color: #ffd76e; font-size: 12px; }

.shop-btn {
  padding: 6px 10px;
  font-size: 13px;
  min-width: auto;
  border-radius: 8px;
}
.shop-btn.sell { background: #28a745; }
.shop-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.rank-row.me { background: #3d3418; border: 1px solid #ffd76e; }
.rank-no { width: 20px; color: #aaa; }
.rank-name { flex: 1; }
.rank-asset { color: #ffd76e; }
</style>
