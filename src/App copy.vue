<template>
  <div class="container">
    <!-- 顶栏 -->
    <div class="header">基于UWB和RTK的室内外高精度融合定位监测系统</div>

    <!-- 主内容区域 -->
    <div class="content">
      <!-- 左侧栏 -->
      <div class="left-sidebar">
        <el-progress type="dashboard" :percentage="percentage2" :color="colors" />
      </div>

      <!-- 中间区域 -->
      <div class="middle">
        <!-- 地图容器 -->
        <div class="map-container">
          <Map />
        </div>

        <!-- 日志区域 -->
        <div class="log-area">
          <div class="log-content">
            <MonitorLogger />
          </div>
        </div>
      </div>

      <!-- 右侧栏 -->
      <div class="right-sidebar">右侧栏</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Map from './components/MonitorMap.vue';
import MonitorLogger from './components/MonitorLogger.vue';
import { onMounted, ref } from 'vue'

const percentage2 = ref(0)

const colors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 },
]

onMounted(() => {
  setInterval(() => {
    percentage2.value = (percentage2.value % 100) + 10
  }, 500)
})
</script>



<style scoped>

.demo-progress .el-progress--line {
  margin-bottom: 15px;
  max-width: 600px;
}

.demo-progress .el-progress--circle {
  margin-right: 15px;
}
/* 全局容器 */
.container {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

/* 顶栏样式 */
.header {
  height: 60px;
  background-color: #f0f0f0;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 主内容区域 */
.content {
  display: flex;
  flex: 1;
  padding: 20px;
  width: 100%;
  margin: 0;
  gap: 20px; /* 添加间距 */
}

/* 左侧栏样式 */
.left-sidebar {
  flex: 1; /* 左侧栏自动调整宽度 */
  background-color: #f8f8f8;
  border-right: 1px solid #e0e0e0;
  padding: 20px;
}

/* 中间区域 */
.middle {
  width: 800px; /* 固定中间区域宽度 */
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 右侧栏样式 */
.right-sidebar {
  flex: 1; /* 右侧栏自动调整宽度 */
  background-color: #f8f8f8;
  border-left: 1px solid #e0e0e0;
  padding: 20px;
}

/* 地图容器样式 */
.map-container {
  height: 600px;
  width: 100%; /* 与父容器等宽 */
  background-color: #e0e0e0;
}

/* 日志区域样式 */
.log-area {
  flex: 1;
  background-color: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
}

.log-content {
  max-height: 100%;
  white-space: pre-wrap;
}
</style>

