<template>
  <div class="mx-auto w-full">
    <div class="bg-white rounded-md shadow-sm p-5">
      <div class="font-semibold text-2xl mb-1">Người dùng bị chặn</div>
      <hr />
      <div class="w-full mt-4">
        <div class="flex flex-col gap-1">
          <!-- No blocked users message -->
          <div v-if="blockedUsers.length === 0">
            <div class="text-center text-zinc-500">
              Không có người dùng nào bị chặn
            </div>
          </div>

          <!-- List of blocked users -->
          <div
            v-for="blockedUser in blockedUsers"
            :key="blockedUser.user.id"
            class="flex justify-between items-center gap-3 p-2 hover:bg-zinc-100 rounded-md"
          >
            <NuxtLink
              :to="`/user/${blockedUser.user.id}`"
              class="flex items-center gap-3"
            >
              <img
                class="w-11 h-11 rounded-md"
                :src="blockedUser.user.profile.avatarUrl || DEFAULT_AVATAR_URL"
                alt="Avatar"
              />
              <div>
                <div class="font-semibold">
                  {{ blockedUser.user.profile.name }}
                </div>
                <div class="text-sm text-gray-500">
                  <span class="font-semibold">Lý do:</span>
                  {{ blockedUser.reason || "Không có lý do" }}
                </div>
              </div>
            </NuxtLink>

            <button
              class="text-blue-500 font-semibold hover:bg-blue-500 hover:text-white border px-3 py-1 rounded-xl border-blue-500"
              @click="unblockUser(blockedUser.user.id)"
            >
              Bỏ chặn
            </button>
          </div>

          <!-- Load more button -->
          <button
            v-if="hasMore"
            @click="loadMore"
            class="mt-4 px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
          >
            Tải thêm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { GroupBlockedUser, User } from "~/types/model";
import { DEFAULT_AVATAR_URL } from "~/types/model";

definePageMeta({
  layout: "group-admin",
});

const route = useRoute();
const toast = useToast();
const groupStore = useGroupStore();

const blockedUsers = ref<GroupBlockedUser[]>([]);
const hasMore = ref(false);
const currentPage = ref(1);
const pageSize = 10;

// Fetch blocked users
async function fetchBlockedUsers(page = 1) {
  try {
    const { data } = await useAPI<
      ApiResponse<{
        list: GroupBlockedUser[];
        pagination: { hasMore: boolean };
      }>
    >(`/api/group/${groupStore.currentGroup?.id}/blocked`, {
      method: "GET",
      params: {
        page,
        pageSize,
      },
    });

    if (data.value?.code === 200) {
      if (page === 1) {
        blockedUsers.value = data.value.data.list;
      } else {
        blockedUsers.value.push(...data.value.data.list);
      }
      hasMore.value = data.value.data.pagination.hasMore;
      currentPage.value = page;
    }
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    toast.error("Không thể tải danh sách người dùng bị chặn");
  }
}

// Unblock user
async function unblockUser(userId: string) {
  try {
    const { data } = await useAPI<ApiResponse>(
      `/api/group/${groupStore.currentGroup?.id}/ban/${userId}`,
      {
        method: "DELETE",
      }
    );

    if (data.value?.code === 200) {
      toast.success("Đã bỏ chặn người dùng");
      blockedUsers.value = blockedUsers.value.filter(
        (user) => user.user.id !== userId
      );
    } else {
      toast.error(data.value?.message || "Không thể bỏ chặn người dùng");
    }
  } catch (error) {
    console.error("Error unblocking user:", error);
    toast.error("Đã xảy ra lỗi khi bỏ chặn người dùng");
  }
}

// Load more users
function loadMore() {
  fetchBlockedUsers(currentPage.value + 1);
}

// Initial fetch
await fetchBlockedUsers();
</script>
