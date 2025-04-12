<template>
  <div class="dashboard-container">
    <!-- <div class="coordinates-display">
      <div class="coordinate-item">
        <span class="label">X 坐标:</span>
        <span class="value">{{ currentPosition.x }}</span>
      </div>
      <div class="coordinate-item">
        <span class="label">Y 坐标:</span>
        <span class="value">{{ currentPosition.y }}</span>
      </div>
      <div class="coordinate-item" v-if="currentArea !== null">
        <span class="label">当前区域:</span>
        <span class="value highlighted">{{ currentArea }}</span>
      </div>
    </div> -->
    <div class="progress-cards">
      <div class="progress-card">
        <el-progress type="dashboard" :percentage="percentage1" :color="colors" class="progress" />
        <div class="progress-label">数字虚拟教学仿真硬件平台</div>
      </div>

      <div class="progress-card">
        <el-progress type="dashboard" :percentage="percentage2" :color="colors" class="progress" />
        <div class="progress-label">RTK</div>
      </div>

      <div class="progress-card">
        <el-progress type="dashboard" :percentage="percentage3" :color="colors" class="progress" />
        <div class="progress-label">UWB</div>
      </div>

      <div class="progress-card">
        <el-progress type="dashboard" :percentage="percentage4" :color="colors" class="progress" />
        <div class="progress-label">IMU</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import mqtt from 'mqtt'

// 坐标数据
const currentPosition = reactive({
  x: 0,
  y: 0
})

// 当前区域状态
const currentArea = ref<number | null>(null)
const perArea = ref<number | null>(null)
// 区域配置
const areas = {
  1: { detection: { x1: 65, y1: 185, x2: 215, y2: 410 } },
  2: { detection: { x1: 310, y1: 180, x2: 435, y2: 305 } }
}

// 进度条值
const percentage1 = ref(0)
const percentage2 = ref(0)
const percentage3 = ref(0)
const percentage4 = ref(0)



// 进度条颜色配置
const colors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 },
]

// MQTT客户端
const client = mqtt.connect('ws://139.224.66.191:8083/mqtt', {
  clean: true,
  connectTimeout: 4000,
  clientId: 'emqx_test_left'
})

// 区域检测函数
const checkCurrentArea = (x: number, y: number): number | null => {
  for (const [areaId, config] of Object.entries(areas)) {
    const { x1, y1, x2, y2 } = config.detection
    if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
      return parseInt(areaId)
    }
  }

  return null
}

const checkWall = (x: number, y: number): { areaId: number | null; isWall: boolean } => {
  for (const [areaId, config] of Object.entries(areas)) {
    const { x1, y1, x2, y2 } = config.detection;

    // 检测是否靠近区域的边界（墙壁）
    const isNearLeftWall = x <= x1 + 4 && x >= x1 - 4 && y >= y1 && y <= y2;
    const isNearRightWall = x <= x2 + 3 && x >= x2 - 3 && y >= y1 && y <= y2;
    const isNearTopWall = y <= y1 + 3 && y >= y1 - 3 && x >= x1 && x <= x2;
    const isNearBottomWall = y <= y2 + 3 && y >= y2 - 3 && x >= x1 && x <= x2;

    if (isNearLeftWall || isNearRightWall || isNearTopWall || isNearBottomWall) {
      return { areaId: parseInt(areaId), isWall: true };
    }
  }

  return { areaId: null, isWall: false };
};


// 随机数生成辅助函数
const getRandomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 初始化MQTT连接
onMounted(() => {
  client.on('connect', () => {
    client.subscribe('location/sensors/#')
  })

  // 消息处理
  client.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString())
      currentPosition.x = data.x
      currentPosition.y = data.y

      perArea.value = currentArea.value
      currentArea.value = checkCurrentArea(Number(data.x), Number(data.y))

    } catch (error) {
      console.error('MQTT消息处理错误:', error)
    }
  })

  // 进度条动画
  const animateProgress = () => {
    percentage1.value = getRandomInRange(40, 50)
  }

  // RTK进度条逻辑
  const updateRtkProgress = () => {
    percentage3.value = currentArea.value !== null
      ? getRandomInRange(80, 100)  // 区域内: 80-100
      : getRandomInRange(0, 10)    // 区域外: 0-10
  }

  // UWB进度条逻辑
  const updateUwbProgress = () => {
    percentage2.value = currentArea.value !== null
      ? getRandomInRange(0, 40)    // 区域内: 0-10
      : getRandomInRange(80, 100)  // 区域外: 80-100
  }

  // LORA进度条逻辑
  const updateLoraProgress = () => {
    const { isWall } = checkWall(currentPosition.x, currentPosition.y);

    // 根据是否靠近墙壁来设置 percentage4.value
    percentage4.value = isWall
      ? getRandomInRange(80, 100) // 靠近墙壁时返回 80-100 的随机值
      : getRandomInRange(0, 10); // 不靠近墙壁时返回 0-10 的随机值
  };

  // 设置动画间隔
  setInterval(animateProgress, 100)
  setInterval(updateRtkProgress, 100)
  setInterval(updateUwbProgress, 100)
  setInterval(updateLoraProgress, 100)
})

// 组件卸载时清理资源
onUnmounted(() => {
  client.end()
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background-color: #1a1a1a; /* 修改为深色背景 */
  min-height: 100vh;
}

.progress-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.progress-card {
  background-color: #2d2d2d; /* 卡片深灰色背景 */
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3); /* 加深阴影 */
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.3s ease;
}

.progress-card:hover {
  transform: translateY(-5px);
}

.progress-label {
  font-size: 16px;
  font-weight: 500;
  color: #ffffff; /* 白色文字 */
  text-align: center;
}

/* 覆盖Element UI组件样式 */
:deep(.el-progress__text) {
  color: #ffffff !important;
  font-size: 20px !important;
}

:deep(.el-progress-circle__track) {
  stroke: #3d3d3d; /* 进度条轨道颜色 */
}
</style>
