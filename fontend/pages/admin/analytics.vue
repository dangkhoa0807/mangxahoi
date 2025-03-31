<template>
  <div class="mx-auto w-full">
    <div class="grid grid-cols-1 gap-4">
      <!-- User Statistics Card -->
      <div class="bg-white rounded-md shadow-sm p-5">
        <div class="font-semibold text-xl mb-4">Thống kê chung</div>

        <!-- User Count Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-sm text-gray-600">Tổng người dùng</div>
            <div class="text-2xl font-bold text-blue-600">
              {{ overallStatistics.users }}
            </div>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg">
            <div class="text-sm text-gray-600">Tổng bài viết</div>
            <div class="text-2xl font-bold text-purple-600">
              {{ overallStatistics.posts }}
            </div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="text-sm text-gray-600">Tổng bình luận</div>
            <div class="text-2xl font-bold text-green-600">
              {{ overallStatistics.comments }}
            </div>
          </div>
          <div class="bg-pink-50 p-4 rounded-lg">
            <div class="text-sm text-gray-600">Tổng nhóm</div>
            <div class="text-2xl font-bold text-pink-600">
              {{ overallStatistics.groups }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <div class="bg-white rounded-md shadow-sm p-5">
        <!-- User Demographics -->
        <div class="mb-6">
          <div class="font-semibold mb-2">Phân bố giới tính</div>
          <Chart
            type="pie"
            :data="genderChartData"
            :options="chartOptions"
            class="h-64"
          />
        </div>
      </div>

      <div class="bg-white rounded-md shadow-sm p-5">
        <!-- Age Distribution -->
        <div>
          <div class="font-semibold mb-2">Phân bố độ tuổi</div>
          <Chart
            type="bar"
            :data="ageChartData"
            :options="chartOptions"
            class="h-64"
          />
        </div>
      </div>

      <div class="bg-white rounded-md shadow-sm p-5">
        <!-- Interaction Trends -->
        <div>
          <div class="font-semibold mb-2">Xu hướng tương tác</div>
          <Chart
            type="line"
            :data="interactionChartData"
            :options="chartOptions"
            class="h-64"
          />
        </div>
      </div>

      <div class="bg-white rounded-md shadow-sm p-5">
        <!-- Post Types -->
        <div class="mb-6">
          <div class="font-semibold mb-2">Loại bài viết</div>
          <Chart
            type="doughnut"
            :data="postTypeChartData"
            :options="chartOptions"
            class="h-64"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";

type OverallStatistics = {
  users: number;
  posts: number;
  comments: number;
  groups: number;
};

type GenderChart = {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
  }[];
};

type AgeChart = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
};

type InteractionChart = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    tension: number;
  }[];
};

type PostTypeChart = {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
  }[];
};

definePageMeta({
  middleware: ["admin"],
});

const overallStatistics = ref<OverallStatistics>({
  users: 0,
  posts: 0,
  comments: 0,
  groups: 0,
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};

// Thống kê giới tính
const genderChartData = ref<GenderChart>({
  labels: ["Nam", "Nữ", "Khác"],
  datasets: [],
});

// Thống kê độ tuổi
const ageChartData = ref<AgeChart>({
  labels: ["18-24", "25-34", "35-44", "45-54", "55+"],
  datasets: [],
});

// Thống kê loại bài viết
const postTypeChartData = ref<PostTypeChart>({
  labels: ["Chỉ văn bản", "Có hình ảnh", "Có video"],
  datasets: [],
});

// Thống kê xu hướng tương tác
const interactionChartData = ref<InteractionChart>({
  labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
  datasets: [],
});

async function getStats() {
  const { data } = await useAPI<
    ApiResponse<{
      gender: GenderChart;
      age: AgeChart;
      overall: OverallStatistics;
      interaction: InteractionChart;
      postType: PostTypeChart;
    }>
  >("/api/admin/dashboard/statistics/all");

  if (data.value?.code == 200) {
    genderChartData.value = data.value.data.gender;
    ageChartData.value = data.value.data.age;
    overallStatistics.value = data.value.data.overall;
    interactionChartData.value = data.value.data.interaction;
    postTypeChartData.value = data.value.data.postType;
  }
}

await getStats();
</script>
