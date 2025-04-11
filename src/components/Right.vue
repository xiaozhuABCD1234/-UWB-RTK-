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
    <el-button type="success">开启数字孪生</el-button>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import mqtt from 'mqtt'

// 坐标系参数
const viewBoxWidth = 800
const viewBoxHeight = 600
const maxPoints = 50 // 最大轨迹点数
const axisTicks = [0, 20, 40, 60, 80, 100]

// 坐标数据
const points = ref<{x: number; y: number}[]>([])
const currentPoint = ref<{x: number; y: number} | null>(null)

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
  // 限制坐标范围
  const clampedX = Math.max(0, Math.min(x, 800))
  const clampedY = Math.max(0, Math.min(y, 600))

  currentPoint.value = { x: clampedX, y: clampedY }

  // 添加新点并限制数量
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
  border: 1px solid #eee;
  background: #fafafa;
}

.chart {
  width: 100%;
  height: 100%;
}

.grid path {
  stroke: #e0e0e0;
  stroke-width: 0.5;
  shape-rendering: crispEdges;
}

.axis path {
  stroke: #757575;
  stroke-width: 1.5;
  shape-rendering: crispEdges;
}

.axis text {
  font: 10px sans-serif;
  fill: #616161;
}

.trajectory {
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
