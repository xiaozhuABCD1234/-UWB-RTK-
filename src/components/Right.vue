<template>
  <div class="chart-container">
    <svg :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`" class="chart">
      <!-- 网格背景 -->
      <g class="grid">
        <!-- X轴网格 -->
        <path
          v-for="(_, index) in 5"
          :key="'x'+index"
          :d="`M ${(index+1)*viewBoxWidth/5} 0 V ${viewBoxHeight}`"
        />
        <!-- Y轴网格 -->
        <path
          v-for="(_, index) in 5"
          :key="'y'+index"
          :d="`M 0 ${(index+1)*viewBoxHeight/5} H ${viewBoxWidth}`"
        />
      </g>

      <!-- 坐标轴 -->
      <g class="axis">
        <!-- X轴 -->
        <path :d="`M 0 ${viewBoxHeight} H ${viewBoxWidth}`" />
        <!-- Y轴 -->
        <path :d="`M 0 0 V ${viewBoxHeight}`" />

        <!-- X轴刻度 -->
        <g v-for="(percent, index) in axisTicks" :key="'xTick'+index">
          <path :d="`M ${index*viewBoxWidth/5} ${viewBoxHeight} v 8`" />
          <text
            :x="index*viewBoxWidth/5"
            :y="viewBoxHeight + 20"
          >{{ percent }}%</text>
        </g>

        <!-- Y轴刻度 -->
        <g v-for="(percent, index) in axisTicks" :key="'yTick'+index">
          <path :d="`M 0 ${viewBoxHeight - index*viewBoxHeight/5} h -8`" />
          <text
            x="-30"
            :y="viewBoxHeight - index*viewBoxHeight/5 + 4"
          >{{ percent }}%</text>
        </g>
      </g>

      <!-- 运动轨迹 -->
      <path
        class="trajectory"
        :d="trajectoryPath"
        stroke="#2196f3"
        fill="none"
        stroke-width="2"
      />

      <!-- 当前位置 -->
      <circle
        v-if="currentPoint"
        :cx="currentPoint.x"
        :cy="viewBoxHeight - currentPoint.y"
        r="4"
        fill="#ff4081"
      />
    </svg>
  </div>
  <div>
    <el-button type="primary" @click="playVideo">开启数字孪生</el-button>
    <el-button type="danger" v-if="showVideo" @click="closeVideo">关闭数字孪生</el-button>
  </div>
  <div v-if="showVideo">
    <video ref="videoPlayer" width="600" muted playsinline>
      <source :src="videoSrc" type="video/mp4">
      您的浏览器不支持视频播放。
    </video>
    <!-- <div class="fake_v"></div> -->
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import mqtt from 'mqtt'
import videoSrc from '@/assets/video.mp4' // 确保路径正确

// 坐标系参数
const viewBoxWidth = 800
const viewBoxHeight = 600
const maxPoints = 50 // 最大轨迹点数
const axisTicks = [0, 20, 40, 60, 80, 100]

// 坐标数据
const points = ref<{x: number; y: number}[]>([])
const currentPoint = ref<{x: number; y: number} | null>(null)

// 视频相关
const showVideo = ref(false)
const videoPlayer = ref<HTMLVideoElement | null>(null)

// MQTT客户端
const client = mqtt.connect('ws://139.224.66.191:8083/mqtt', {
  clean: true,
  clientId: `client_${Math.random().toString(16).substr(2, 8)}`
})

// 生成轨迹路径
const trajectoryPath = computed(() => {
  if (points.value.length < 2) return ''

  return points.value
    .map((p, i) =>
      i === 0 ?
        `M ${p.x} ${viewBoxHeight - p.y}` :
        `L ${p.x} ${viewBoxHeight - p.y}`
    )
    .join(' ')
})

// 处理坐标数据
const handleNewPoint = (x: number, y: number) => {
  const clampedX = Math.max(0, Math.min(x, viewBoxWidth))
  const clampedY = Math.max(0, Math.min(y, viewBoxHeight))

  currentPoint.value = { x: clampedX, y: clampedY }
  points.value = [
    ...points.value.slice(-maxPoints + 1),
    { x: clampedX, y: clampedY }
  ]
}

// MQTT消息处理
client.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString())
    if (data.x && data.y) {
      handleNewPoint(Number(data.x), Number(data.y))
    }
  } catch (error) {
    console.error('消息解析失败:', error)
  }
})

// 播放视频
const playVideo = async () => {
  showVideo.value = true
  await nextTick()
  if (videoPlayer.value) {
    try {
      videoPlayer.value.currentTime = 0 // 重置播放位置
      await videoPlayer.value.play()
    } catch (error) {
      console.error('视频播放失败:', error)
      // 可以在这里添加用户交互后重试的逻辑
    }
  }
}

// 关闭视频
const closeVideo = () => {
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.currentTime = 0
  }
  showVideo.value = false
}

onMounted(() => {
  client.on('connect', () => {
    client.subscribe('location/sensors/#', { qos: 1 })
  })
})

onUnmounted(() => {
  client.end()
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 600px;
  border: 1px solid #444444; /* 深色边框 */
  background: #2a2a2a; /* 深色背景 */
}

.chart {
  width: 100%;
  height: 100%;
}

.grid path {
  stroke: #444444; /* 深色网格线 */
  stroke-width: 0.5;
  shape-rendering: crispEdges;
}

.axis path {
  stroke: #666666; /* 深色轴线 */
  stroke-width: 1.5;
  shape-rendering: crispEdges;
}

.axis text {
  font: 10px sans-serif;
  fill: #e0e0e0; /* 浅色文字，确保在深色背景下可读 */
}

.trajectory {
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke: #8888ff; /* 轨迹颜色，亮色以便在深色背景下可见 */
}
</style>
