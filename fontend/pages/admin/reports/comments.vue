<template>
  <div class="max-w-4xl mx-auto bg-gray-100">
    <h1 class="text-2xl font-bold mb-4 mt-2">Quản lý báo cáo bình luận</h1>

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

    <div v-if="!reports.length">Chưa có bình luận nào được báo cáo.</div>

    <div class="flex flex-col gap-4">
      <ReportCard
        v-for="report in reports"
        :key="report.id"
        :comment="report.comment"
        :user="report.user"
        :id="report.id"
        :status="report.status"
        :reason="report.reason"
        :description="report.description"
        :created-at="report.createdAt"
        @kept="fetchReportComments"
        @removed="handleRemovedComment"
      />
    </div>

    <div class="mt-4 p-4 bg-white rounded-md shadow-sm">
      <PaginationVue
        v-model="page"
        :total-items="pagination?.totalCount || 0"
        :per-page="pageSize"
        @page-change="fetchReportComments"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ReportCard from "~/components/Comment/ReportCard.vue";
import type { ApiResponse } from "~/types/api";
import type { Comment, User } from "~/types/model";
import type { Pagination } from "~/types/model";
import PaginationVue from "~/components/Pagination.vue";

definePageMeta({
  middleware: ["admin"],
});

const toast = useToast();

interface ReportedComment {
  id: string;
  comment: Comment;
  user: User;
  status: string;
  reason: string;
  description: string;
  createdAt: string;
}

const reports = ref<ReportedComment[]>([]);
const filterStatus = ref<string>("ALL");
const pageSize = ref(8);
const page = ref(1);
const pagination = ref<Pagination | null>(null);

async function fetchReportComments() {
  const { data } = await useAPI<
    ApiResponse<{
      list: ReportedComment[];
      pagination: Pagination;
    }>
  >("/api/admin/report/comments", {
    query: {
      status: filterStatus.value,
      page: page.value,
      pageSize: pageSize.value,
    },
  });

  if (data.value?.code == 200) {
    reports.value = data.value.data.list;
    pagination.value = data.value.data.pagination;
  }
}

await fetchReportComments();

async function handleRemovedComment(reportId: string) {
  console.log(reportId);
  reports.value = reports.value.filter((report) => report.id !== reportId);
}

watch(filterStatus, () => {
  page.value = 1;
  fetchReportComments();
});
</script>
