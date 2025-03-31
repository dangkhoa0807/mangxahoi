<template>
  <div class="max-w-4xl mx-auto bg-gray-100">
    <h1 class="text-2xl font-bold mb-4 mt-2">Quản lý báo cáo bài viết</h1>

    <div class="w-full grid grid-cols-4 gap-4 mb-4">
      <div class="col-span-1">
        <Select
          class="w-full"
          v-model="filterStatus"
          :options="[
            {
              name: 'Tất cả',
              code: 'ALL',
            },
            {
              name: 'Chưa xử lý',
              code: 'PENDING',
            },
            {
              name: 'Đã từ chối',
              code: 'REJECTED',
            },
            {
              name: 'Đã xử lý',
              code: 'RESOLVED',
            },
          ]"
          optionLabel="name"
          optionValue="code"
        />
      </div>
    </div>

    <div v-if="!reports.length">Chưa có bài viết nào được báo cáo.</div>

    <div class="flex flex-col gap-4">
      <PostReportCard
        v-for="report in reports"
        :key="report.id"
        :post="report.post"
        :user="report.user"
        :id="report.id"
        :status="report.status"
        :reason="report.reason"
        :description="report.description"
        :created-at="report.createdAt"
        @removed="handleRemovedPost"
        @kept="handleKeptPost"
      />
    </div>

    <div class="mt-4 p-4 bg-white rounded-md shadow-sm">
      <PaginationVue
        v-model="page"
        :total-items="pagination?.totalCount || 0"
        :per-page="pageSize"
        @page-change="fetchReportPosts"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import PostReportCard from "~/components/Post/PostReportCard.vue";
import type { ApiResponse } from "~/types/api";
import type { Post, User, Pagination as PaginationType } from "~/types/model";
import PaginationVue from "~/components/Pagination.vue";

definePageMeta({
  middleware: ["admin"],
});

interface ReportedPost {
  id: string;
  post: Post;
  user: User;
  status: string;
  reason: string;
  description: string;
  createdAt: string;
}

const reports = ref<ReportedPost[]>([]);
const filterStatus = ref<string>("ALL");
const showKeepDialog = ref(false);
const selectedReportId = ref<string>("");

// Add new pagination related refs
const page = ref(1);
const pageSize = ref(5);
const pagination = ref<PaginationType | null>(null);

async function fetchReportPosts(page = 1) {
  const { data } = await useAPI<
    ApiResponse<{
      list: ReportedPost[];
      pagination: PaginationType;
    }>
  >("/api/admin/report/posts", {
    query: {
      status: filterStatus.value,
      page,
      pageSize: pageSize.value,
    },
  });

  if (data.value?.code == 200) {
    reports.value = data.value.data.list;
    pagination.value = data.value.data.pagination;
  }
}

await fetchReportPosts();

function handleKeptPost(reportId: string) {
  console.log(reportId);
  const index = reports.value.findIndex((report) => report.id === reportId);
  if (index !== -1) {
    reports.value[index].status = "REJECTED";
  }
}

function handleRemovedPost(reportId: string) {
  const index = reports.value.findIndex((report) => report.id === reportId);
  console.log(index);
  if (index !== -1) {
    reports.value[index].status = "RESOLVED";
    console.log(reports.value[index]);
  }
}

watch(filterStatus, () => {
  page.value = 1;
  fetchReportPosts(1);
});
</script>
