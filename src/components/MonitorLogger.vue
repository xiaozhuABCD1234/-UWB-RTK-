<template>
  <div class="log-container">
    <div class="status-bar">
      <div class="status-indicator" :style="{ backgroundColor: statusColor }"></div>
      <span class="status-text">{{ statusText }}</span>
      <button class="clear-btn" @click="clearLogs">清空日志</button>
    </div>

    <div class="log-viewport" ref="viewport" @scroll="handleScroll">
      <div class="log-scroll-track" :style="{ height: totalHeight + 'px' }">
        <div class="log-item" v-for="log in visibleLogs" :key="log.id" :style="getItemStyle(log)">
          <span class="timestamp">{{ log.timestamp }}</span>
          <span class="type-tag" :class="log.type">{{ log.type.toUpperCase() }}</span>
          <span class="message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import mqtt from 'mqtt'

interface LogEntry {
  id: number
  timestamp: string
  type: 'info' | 'success' | 'error'
  message: string
  height: number
}

// 状态管理
const statusMap = {
  connecting: { color: '#ffc107', text: '连接中...' },
  connected: { color: '#4caf50', text: '已连接' },
  error: { color: '#f44336', text: '连接错误' }
}

const logs = reactive<LogEntry[]>([])
const viewport = ref<HTMLElement>()
const scrollTop = ref(0)
const autoScroll = ref(true)
const logCounter = ref(0)
const itemHeights = new Map<number, number>()

// 状态控制
const statusColor = ref(statusMap.connecting.color)
const statusText = ref(statusMap.connecting.text)

// 虚拟滚动相关
const ITEM_HEIGHT_ESTIMATE = 48 // 预估行高
const VISIBLE_BUFFER = 5

const viewportHeight = computed(() => viewport.value?.clientHeight || 0)
const totalHeight = computed(() => logs.reduce((sum, log) => sum + log.height, 0))

const visibleRange = computed(() => {
  let start = 0
  let sum = 0
  const end = scrollTop.value + viewportHeight.value

  while (start < logs.length && sum + logs[start].height < scrollTop.value) {
    sum += logs[start].height
    start++
  }

  let visibleEnd = start
  while (visibleEnd < logs.length && sum < end) {
    sum += logs[visibleEnd].height
    visibleEnd++
  }

  return {
    start: Math.max(0, start - VISIBLE_BUFFER),
    end: Math.min(logs.length, visibleEnd + VISIBLE_BUFFER)
  }
})

const visibleLogs = computed(() =>
  logs.slice(visibleRange.value.start, visibleRange.value.end)
)

// 样式计算
const getItemStyle = (log: LogEntry) => ({
  transform: `translateY(${getItemOffset(log.id)}px)`
})

function getItemOffset(id: number) {
  let offset = 0
  for (const log of logs) {
    if (log.id === id) break
    offset += log.height
  }
  return offset
}

// 滚动处理
function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  scrollTop.value = target.scrollTop

  // 自动滚动逻辑判断
  const threshold = 50
  autoScroll.value =
    target.scrollHeight - target.scrollTop - target.clientHeight < threshold
}

// 日志管理
function addLog(type: LogEntry['type'], message: string) {
  const newLog = {
    id: ++logCounter.value,
    timestamp: new Date().toLocaleTimeString(),
    type,
    message,
    height: ITEM_HEIGHT_ESTIMATE
  };

  logs.push(newLog);

  // 保留最多5条日志，超过时只保留最后4条
  if (logs.length > 5) {
    logs.splice(0, logs.length - 4);
  }

  // 自动滚动逻辑
  nextTick(() => {
    if (autoScroll.value && viewport.value) {
      viewport.value.scrollTop = viewport.value.scrollHeight;
    }
    measureItemHeight(newLog);
  });
}

function measureItemHeight(log: LogEntry) {
  nextTick(() => {
    const item = document.querySelector(`[data-log-id="${log.id}"]`)
    if (item) {
      const height = item.clientHeight
      log.height = height
    }
  })
}

function clearLogs() {
  logs.splice(0, logs.length)
  logCounter.value = 0
}

// MQTT 连接
let client: mqtt.MqttClient | null = null

const mqttConfig = {
  url: 'ws://139.224.66.191:8083/mqtt',
  options: {
    clean: true,
    connectTimeout: 4000,
    clientId: `web-client-${Math.random().toString(36).substr(2, 8)}`,
    reconnectPeriod: 5000
  }
}

function updateStatus(status: keyof typeof statusMap) {
  statusColor.value = statusMap[status].color
  statusText.value = statusMap[status].text
}

onMounted(() => {
  client = mqtt.connect(mqttConfig.url, mqttConfig.options)

  client.on('connect', () => {
    updateStatus('connected')
    addLog('success', '成功连接 MQTT 服务器')

    client!.subscribe('location/sensors/#', (err) => {
      if (err) {
        addLog('error', `订阅失败: ${err.message}`)
      } else {
        addLog('success', '成功订阅主题: location/sensors/#')
      }
    })
  })

  client.on('message', (topic, message) => {
    try {
      const payload = JSON.parse(message.toString())
      console.log(payload.x)
      let cx = (payload.x*12.3).toFixed(2)
      let cy = (payload.y*12.3).toFixed(2)
      addLog('info', `主题 ${topic}: x:${cx},y:${cy}`)
    } catch (error) {
      addLog('error', `消息解析失败: ${(error as Error).message}`)
    }
  })

  client.on('error', (err) => {
    updateStatus('error')
    addLog('error', `MQTT 错误: ${err.message}`)
  })

  client.on('reconnect', () => {
    updateStatus('connecting')
    addLog('info', '尝试重新连接...')
  })
})

onUnmounted(() => {
  client?.end()
  addLog('info', 'MQTT 连接已关闭')
})
</script>

<style scoped>
.log-container {
  width: 100%;
  height: 100%;
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.status-bar {
  padding: 12px 16px;
  background: #2d2d2d;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #3a3a3a;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
}

.status-text {
  color: #fff;
  font-size: 14px;
}

.clear-btn {
  margin-left: auto;
  padding: 4px 12px;
  background: #4a4a4a;
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: #5a5a5a;
}

.log-viewport {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.log-scroll-track {
  position: relative;
  width: 100%;
}

.log-item {
  position: absolute;
  width: 100%;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: #e0e0e0;
  border-bottom: 1px solid #3a3a3a;
  transition: background 0.2s;
}

.log-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.timestamp {
  color: #858585;
  font-size: 12px;
  min-width: 80px;
}

.type-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

.type-tag.info {
  background: rgba(33, 150, 243, 0.15);
  color: #2196f3;
}

.type-tag.success {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}

.type-tag.error {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
}

.message {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Menlo', monospace;
  font-size: 13px;
}

/* 自定义滚动条 */
.log-viewport::-webkit-scrollbar {
  width: 8px;
}

.log-viewport::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.log-viewport::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}
</style>
