<template>
  <div class="container">
    <!-- 顶栏 -->
    <div class="header">基于UWB和RTK的室内外高精度融合定位监测系统</div>

    <!-- 主内容区域 -->
    <div class="content">
      <!-- 左侧栏 -->
      <div class="left-sidebar">
        <Left />
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
      <div class="right-sidebar">
        <Right />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Map from './components/MonitorMap.vue';
import MonitorLogger from './components/MonitorLogger.vue';
import Left from './components/Left.vue';
import Right from './components/Right.vue';
</script>

<style scoped>
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
  background-color: #1a1a1a; /* 深色背景 */
  color: #ffffff; /* 文字颜色为白色 */
}

/* 顶栏样式 */
.header {
  height: 60px;
  background-color: #2c2c2c; /* 深色顶栏 */
  border-bottom: 1px solid #444444; /* 深色边框 */
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); /* 深色阴影 */
  color: #ffffff; /* 文字颜色为白色 */
}

/* 主内容区域 */
.content {
  display: flex;
  flex: 1;
  padding: 20px;
  width: 100%;
  margin: 0;
  gap: 20px;
}

/* 左侧栏样式 */
.left-sidebar {
  flex: 1;
  background-color: #333333; /* 深色背景 */
  border-right: 1px solid #444444; /* 深色边框 */
  padding: 20px;
  color: #ffffff; /* 文字颜色为白色 */
}

/* 中间区域 */
.middle {
  width: 800px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 右侧栏样式 */
.right-sidebar {
  flex: 1;
  background-color: #333333; /* 深色背景 */
  border-left: 1px solid #444444; /* 深色边框 */
  padding: 20px;
  color: #ffffff; /* 文字颜色为白色 */
}

/* 地图容器样式 */
.map-container {
  height: 600px;
  width: 100%;
  background-color: #333333; /* 深色背景 */
}

/* 日志区域样式 */
.log-area {
  flex: 1;
  background-color: #444444; /* 深色背景 */
  padding: 20px;
  overflow-y: auto;
  color: #ffffff; /* 文字颜色为白色 */
}

.log-content {
  max-height: 100%;
  white-space: pre-wrap;
  color: #ffffff; /* 文字颜色为白色 */
}
</style>
