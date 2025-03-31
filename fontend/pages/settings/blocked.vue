<template>
  <div class="mx-auto w-full">
    <div class="bg-white rounded-md shadow-sm p-5">
      <div class="font-semibold text-2xl mb-1">Người dùng đã chặn</div>
      <hr />
      <div class="w-full mt-4">
        <div class="flex flex-col gap-1">
          <div v-if="blockedUsers.length === 0">
            <div class="text-center text-zinc-500">
              Không có người dùng nào bị chặn
            </div>
          </div>
          <div
            v-for="user in blockedUsers"
            :key="user.id"
            class="flex justify-between items-center gap-3 p-2 hover:bg-zinc-100 rounded-md cursor-pointer"
          >
            <NuxtLink :to="`/user/${user.id}`" class="flex items-center gap-3">
              <img
                class="w-11 h-11 rounded-md"
                :src="
                  user.profile.avatarUrl ||
                  'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
                "
                alt="Avatar"
              />
              <div class="col-span-8">
                <span class="font-semibold">{{ user.profile.name }}</span>
              </div>
            </NuxtLink>
            <div
              class="text-blue-500 font-semibold hover:bg-blue-500 hover:text-white border px-2 rounded-xl border-blue-500"
              @click="unblockUser(user.id)"
            >
              Bỏ chặn
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { userBlockService } from "~/services/userBlock";
import type { ApiResponse } from "~/types/api";
import type { User } from "~/types/model";

const blockedUsers = ref<User[]>([]);
const hasMore = ref(false);
const toast = useToast();

async function fetchBlockedUsers() {
  try {
    const { data } = await useAPI<
      ApiResponse<{
        list: any[];
        paginate: { hasMore: boolean };
      }>
    >("/api/block", {
      method: "GET",
    });
    if (data.value?.code === 200) {
      blockedUsers.value = data.value.data.list.map((item) => item.blocked);
      hasMore.value = data.value.data.paginate.hasMore;
    }
  } catch (error) {
    console.error("Error fetching blocked users:", error);
  }
}

async function unblockUser(userId: string) {
  try {
    const { data } = await userBlockService.unblock(userId);

    if (data.value?.code === 200) {
      blockedUsers.value = blockedUsers.value.filter(
        (user) => user.id !== userId
      );
      toast.success(data.value.message);
    }
  } catch (error) {
    console.error("Error unblocking user:", error);
  }
}

await fetchBlockedUsers();
</script>
