<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-sm text-gray-500">過去</span>
      <el-input-number
        v-model="days"
        :min="1"
        :max="365"
        size="small"
        controls-position="right"
        @change="fetchData"
      />
      <span class="text-sm text-gray-500">天</span>
      <el-button-group>
        <el-button
          v-for="preset in DAY_PRESETS"
          :key="preset"
          size="small"
          :type="days === preset ? 'primary' : 'default'"
          @click="setDays(preset)"
        >
          {{ preset }} 天
        </el-button>
      </el-button-group>
      <el-button size="small" :loading="loading" @click="fetchData">
        重新整理
      </el-button>
      <span class="text-sm text-gray-500">
        {{ viewName }}，用量前 {{ USER_LIMIT }} 名，共 {{ users.length }} 位使用者
      </span>
    </div>

    <div ref="chartRef" v-loading="loading" class="h-[55vh] w-full"></div>

    <el-table
      :data="users"
      border
      stripe
      max-height="40vh"
      highlight-current-row
      @current-change="highlightUser"
    >
      <el-table-column type="index" label="排名" width="70" />
      <el-table-column prop="user_name" label="使用者" min-width="140" />
      <el-table-column prop="user_email" label="Email" min-width="200" />
      <el-table-column prop="total" label="總用量" width="100" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useApi } from "@/composables/useApi.js";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

const props = defineProps({
  viewName: { type: String, required: true },
});

const DAY_PRESETS = [1, 5, 30];
const USER_LIMIT = 1000;
// 天數多時隱藏資料點，避免上千條線 × 每日點數造成卡頓
const MAX_DAYS_WITH_SYMBOL = 60;

const MYAPI = useApi();

const days = ref(30);
const loading = ref(false);
const users = ref([]);
const chartRef = ref(null);
const chart = shallowRef(null);
let resizeObserver = null;

const setDays = (value) => {
  days.value = value;
  fetchData();
};

const renderChart = (dates) => {
  const showSymbol = dates.length <= MAX_DAYS_WITH_SYMBOL;
  chart.value.setOption(
    {
      animation: false,
      grid: { left: 50, right: 30, top: 20, bottom: 60 },
      tooltip: {
        trigger: "item",
        formatter: ({ seriesName, name, value }) =>
          `${seriesName}<br/>${name}：${value}`,
      },
      xAxis: { type: "category", data: dates, boundaryGap: false },
      yAxis: { type: "value", name: "用量", minInterval: 1 },
      dataZoom: [{ type: "inside" }, { type: "slider" }],
      series: users.value.map((user) => ({
        name: user.user_name || user.user_email,
        type: "line",
        data: user.data,
        showSymbol,
        symbolSize: 5,
        lineStyle: { width: 1 },
        emphasis: { focus: "series", lineStyle: { width: 3 } },
      })),
    },
    { notMerge: true },
  );
};

const fetchData = async () => {
  if (!days.value) return;
  loading.value = true;
  try {
    const res = await MYAPI.get("/get_usage_trend/" + props.viewName, {
      days: days.value,
      limit: USER_LIMIT,
    });
    if (res.status === "success") {
      users.value = res.data.users;
      renderChart(res.data.dates);
    } else {
      ElMessage.error(res.message || "無法取得用量資料");
    }
  } catch (error) {
    console.error("取得用量趨勢時發生錯誤:", error);
    ElMessage.error("取得資料時發生網路錯誤");
  } finally {
    loading.value = false;
  }
};

// 點選表格中的使用者時，在圖上突顯該使用者的折線
const highlightUser = (row) => {
  if (!chart.value) return;
  chart.value.dispatchAction({ type: "downplay" });
  if (!row) return;
  chart.value.dispatchAction({
    type: "highlight",
    seriesIndex: users.value.indexOf(row),
  });
};

onMounted(() => {
  chart.value = echarts.init(chartRef.value);
  resizeObserver = new ResizeObserver(() => chart.value?.resize());
  resizeObserver.observe(chartRef.value);
  fetchData();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  chart.value?.dispose();
});
</script>
