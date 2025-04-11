<template>

  <div class="map-container">
    <div class="map-content" ref="mapContent">
      <div class="map-background"></div>
      <svg ref="trajectory" class="trajectory"></svg>
    </div>
    <!-- 将红点和坐标放在容器外，不受地图缩放影响 -->
    <div ref="dot" class="dot"></div>
    <div ref="coordinates" class="coordinates"></div>
  </div>

</template>
<style scoped>
.map-container {
  position: relative;
  width: 800px;
  height: 600px;
  overflow: hidden;
}

.map-content {
  position: absolute;
  width: 100%;
  height: 100%;
  transition: transform 0.5s ease;
  transform-origin: 0 0;
  /* 设置变换原点为左上角 */
}

.map-background {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: url(../assets/map4.jpg);
  background-size: cover;
  background-position: center;
}

.dot {
  position: absolute;
  width: 5px;
  height: 5px;
  background-color: red;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  transition: left 0.3s, top 0.3s;
}

.coordinates {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 12px;
  transform: translate(-50%, 0);
  z-index: 10;
  transition: left 0.3s, top 0.3s;
  white-space: nowrap;
}

.trajectory {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 5;
}
</style>
<script lang="ts" setup>
import { ref, onMounted, reactive, watch } from 'vue';
import mqtt from 'mqtt';

const dot = ref(null);
const trajectory = ref(null);
const mapContent = ref(null);
const coordinates = ref(null);
const trajectoryPoints = ref([]);

// 当前变换状态
const transform = reactive({
  scale: 1,
  translateX: 0,
  translateY: 0,
  currentArea: null
});

// 记录原始坐标
const currentPosition = reactive({
  x: 0,
  y: 0
});

// MQTT连接配置
const options = {
  clean: true,
  connectTimeout: 4000,
  clientId: 'emqx_test_map',
  username: '',
  password: '',
};
const connectUrl = 'ws://139.224.66.191:8083/mqtt';
const client = mqtt.connect(connectUrl, options);

// 区域配置
const areas = {
  1: {
    detection: { x1: 80, y1: 195, x2: 200, y2: 400 }, // 判定区域
  },
  2: {
    detection: { x1: 320, y1: 190, x2: 425, y2: 295 }, // 判定区域
  }
};

client.on('connect', () => {
  console.log('Connected');
  client.subscribe('location/sensors/#');
});

client.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const x = Number(data.x);
    const y = Number(data.y);

    // 保存原始坐标
    currentPosition.x = x;
    currentPosition.y = y;

    // 记录轨迹
    trajectoryPoints.value.push({ x, y });
    drawTrajectory();

    // 检测当前区域
    const currentArea = checkCurrentArea(x, y);

    // 只有区域变化时才重新应用缩放
    if (currentArea !== transform.currentArea) {
      applyZoomTransform(currentArea);
    }

    // 更新红点位置
    updateDotPosition(x, y);
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

function checkCurrentArea(x, y) {
  for (const [areaId, config] of Object.entries(areas)) {
    const { x1, y1, x2, y2 } = config.detection;
    if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
      return parseInt(areaId);
    }
  }
  return null;
}

function applyZoomTransform(areaId) {
  if (!mapContent.value) return;

  const containerWidth = 800;
  const containerHeight = 600;

  // 保存当前区域
  transform.currentArea = areaId;

  if (areaId && areas[areaId]) {
    const { x1, y1, x2, y2 } = areas[areaId].detection;
    transform.scale = 2;

    // 计算区域的中心点
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;

    // 容器的中心点
    const containerCenterX = containerWidth / 2;
    const containerCenterY = containerHeight / 2;

    // 计算平移量，确保缩放后的区域在容器中居中显示
    transform.translateX = containerCenterX - centerX * transform.scale;
    transform.translateY = containerCenterY - centerY * transform.scale;
  } else {
    transform.scale = 1;
    transform.translateX = 0;
    transform.translateY = 0;
  }

  // 应用变换
  mapContent.value.style.transform = `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`;
}

function updateDotPosition(x, y) {
  if (!dot.value || !coordinates.value) return;

  // 计算红点在容器中的位置
  // 这是关键修改：先应用平移，然后应用缩放
  const containerX = transform.translateX + x * transform.scale;
  const containerY = transform.translateY + y * transform.scale;

  // 更新红点位置
  dot.value.style.left = `${containerX}px`;
  dot.value.style.top = `${containerY}px`;

  // 更新坐标显示
  coordinates.value.style.left = `${containerX}px`;
  coordinates.value.style.top = `${containerY + 10}px`; // 在红点下方10px处显示
  coordinates.value.textContent = `x: ${((x.toFixed(0))*12.3).toFixed(2)}, y: ${((y.toFixed(0))*12.3).toFixed(2)}`;
}

function drawTrajectory() {
  if (!trajectory.value) return;

  // 绘制轨迹，不需要额外的变换，因为SVG在地图内部
  const pathData = trajectoryPoints.value
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    )
    .join(' ');

  trajectory.value.innerHTML = `
    <path d="${pathData}"
          stroke="rgba(255,0,0,0.5)"
          stroke-width="2"
          stroke-dasharray="5 5"
          fill="none" />
  `;
}

onMounted(() => {
  // 初始位置设置
  const initialX = 100;
  const initialY = 100;

  // 初始化当前位置
  currentPosition.x = initialX;
  currentPosition.y = initialY;

  // 设置初始位置
  updateDotPosition(initialX, initialY);
});
</script>
