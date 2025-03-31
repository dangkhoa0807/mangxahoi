<template>
  <div v-if="groupStore.currentGroup">
    <div class="bg-gray-100">
      <!-- Group Members Section -->
      <div
        class="bg-white text-gray-900 p-4 rounded-md shadow-sm mb-6 border-gray-300 flex flex-col gap-4"
      >
        <h3 class="text-xl font-semibold">Người thành lập</h3>

        <div class="flex flex-col gap-3">
          <hr />

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <img
                :src="
                  groupStore.currentGroup?.owner.profile.avatarUrl ??
                  `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
                "
                alt="Avatar"
                class="avatar w-11 h-11 rounded-md"
              />
              <div class="ml-4">
                <!-- Margin-left for name and role -->

                <NuxtLink
                  :to="`/user/${groupStore.currentGroup?.owner.id}`"
                  class="font-semibold text-gray-900 cursor-pointer"
                >
                  {{ groupStore.currentGroup?.owner.profile.name }}
                </NuxtLink>
                <p class="text-sm text-gray-600">Quản trị viên</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Nút tải thêm -->
        <button
          v-if="hasMore"
          @click="loadMore"
          class="mt-4 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Tải thêm
        </button>
      </div>
    </div>

    <div class="bg-gray-100 mt-4">
      <!-- Group Members Section -->
      <div
        class="bg-white text-gray-900 p-4 rounded-md shadow-sm mb-6 border-gray-300 flex flex-col gap-4"
      >
        <h3 class="text-xl font-semibold">
          Thành viên ({{
            formatNumber(groupStore.currentGroup?._count.members ?? 0)
          }})
        </h3>
        <input
          type="text"
          placeholder="Tìm kiếm thành viên ..."
          class="w-full p-2 px-3 border border-gray-300 rounded-md outline-none"
          v-model="searchQuery"
        />

        <div class="flex flex-col gap-3">
          <hr />

          <div v-if="!members.length">Không có kết quả nào.</div>
          <div
            v-for="member in members"
            :key="member.id"
            class="flex items-center justify-between"
          >
            <div class="flex items-center">
              <img
                :src="
                  member.user.profile.avatarUrl ??
                  `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
                "
                alt="Avatar"
                class="avatar w-11 h-11 rounded-md"
              />
              <div class="ml-4">
                <!-- Margin-left for name and role -->
                <NuxtLink
                  :to="`/user/${member.user.id}`"
                  class="font-semibold text-gray-900 cursor-pointer"
                >
                  {{ member.user.profile.name }}
                </NuxtLink>
                <p class="text-sm text-gray-600">{{ member.role }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="
                  !member.isFriend &&
                  !member.hasFriendRequest &&
                  member.user.id != auth.user?.id
                "
                @click="addFriend(member.user.id)"
                class="px-4 py-1 text-sm font-semibold text-blue-600 border border-blue-600 rounded-full hover:bg-blue-100"
              >
                Thêm bạn bè
              </button>
              <button
                v-else-if="member.hasFriendRequest"
                class="px-4 py-1 text-sm font-semibold text-blue-600 border border-blue-600 rounded-full hover:bg-blue-100"
                @click="cancelFriendRequest(member.user.id)"
              >
                Huỷ yêu cầu
              </button>

              <HeadlessMenu
                as="div"
                class="relative inline-block text-left"
                v-if="groupStore.currentGroup.isOwner"
              >
                <div>
                  <HeadlessMenuButton
                    class="w-8 h-8 flex justify-center items-center hover:bg-gray-100 rounded-full"
                  >
                    <Icon
                      name="tabler:dots-vertical"
                      class="text-2xl text-gray-700"
                    />
                  </HeadlessMenuButton>
                </div>

                <transition
                  enter-active-class="transition duration-100 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-75 ease-in"
                  leave-from-class="transform scale-100 opacity-100"
                  leave-to-class="transform scale-95 opacity-0"
                >
                  <HeadlessMenuItems
                    :class="[
                      'absolute right-0 z-30 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none',
                      isLastItems(member) ? 'bottom-full' : '',
                    ]"
                  >
                    <div class="p-2">
                      <HeadlessMenuItem v-slot="{ active }">
                        <div
                          class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
                          @click="kickMember(member.user.id)"
                        >
                          <Icon
                            name="material-symbols:delete-outline"
                            class="text-2xl text-gray-600"
                          />
                          Xóa khỏi nhóm
                        </div>
                      </HeadlessMenuItem>

                      <HeadlessMenuItem v-slot="{ active }">
                        <div
                          class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
                          @click="openBlockDialog(member.user.id)"
                        >
                          <Icon
                            name="tabler:ban"
                            class="text-2xl text-gray-600"
                          />
                          Chặn khỏi nhóm
                        </div>
                      </HeadlessMenuItem>
                    </div>
                  </HeadlessMenuItems>
                </transition>
              </HeadlessMenu>
            </div>
          </div>
        </div>

        <!-- Nút tải thêm -->
        <button
          v-if="hasMore"
          @click="loadMore"
          class="mt-4 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Tải thêm
        </button>
      </div>
    </div>

    <BlockMember
      v-model="showBlockDialog"
      :group-id="groupStore.currentGroup?.id"
      :user-id="selectedUserId"
      @blocked="fetchMembers"
    />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { GroupMember } from "~/types/model";
import { friendService } from "~/services/friend";
import { groupService } from "~/services/group";
import BlockMember from "~/components/Dialog/Group/BlockMember.vue";
import { formatNumber } from "~/utils/formatNumber";

const searchQuery = ref("");
const members = ref<GroupMember[]>([]);
const currentPage = ref(1);
const hasMore = ref(false);

const slug = useRoute().params.slug as string;
const groupStore = useGroupStore();
const toast = useToast();
const auth = useAuth();

useHead({
  title: `Thành viên - ${groupStore.currentGroup?.name}`,
});

async function fetchMembers(reset = false) {
  if (reset) {
    currentPage.value = 1;
    members.value = [];
  }

  const { data } = await useAPI<
    ApiResponse<{
      list: GroupMember[];
      hasMore: boolean;
    }>
  >(`/api/group/${groupStore.currentGroup?.id}/members`, {
    method: "GET",
    params: {
      search: searchQuery.value,
      page: currentPage.value,
      pageSize: 10,
    },
  });

  if (data.value?.code == 200) {
    members.value = reset
      ? data.value.data.list
      : [...members.value, ...data.value.data.list];

    hasMore.value = data.value.data.hasMore;
  }
}

async function addFriend(userId: string) {
  const { data } = await friendService.addFriend(userId);

  if (data.value?.code == 200) {
    toast.success(data.value.message);
    const index = members.value.findIndex(
      (member) => member.user.id === userId
    );
    if (index !== -1) {
      members.value[index].hasFriendRequest = true;
    }
  } else {
    toast.error(data.value?.message || "Gửi lời mời kết bạn thất bại");
  }
}

async function cancelFriendRequest(userId: string) {
  const { data } = await friendService.cancelFriendRequest(userId);

  if (data.value?.code == 200) {
    toast.success(data.value.message);
    const index = members.value.findIndex(
      (member) => member.user.id === userId
    );
    if (index !== -1) {
      members.value[index].hasFriendRequest = false;
    }
  }
}

const debouncedFetchMembers = useDebounce(() => fetchMembers(true), 300);

watch(searchQuery, () => {
  debouncedFetchMembers();
});

function loadMore() {
  currentPage.value++;
  fetchMembers();
}

async function kickMember(userId: string) {
  if (!groupStore.currentGroup || !groupStore.currentGroup.isOwner) return;

  const { data } = await groupService.kickMember(
    groupStore.currentGroup.id,
    userId
  );

  if (data.value?.code === 200) {
    toast.success("Đã xóa thành viên khỏi nhóm");

    members.value = members.value.filter((member) => member.user.id !== userId);

    await groupStore.fetchGroup(slug);
  } else {
    toast.error(data.value?.message || "Không thể xóa thành viên");
  }
}

// Chặn thành viên
const showBlockDialog = ref(false);
const selectedUserId = ref("");

function openBlockDialog(userId: string) {
  selectedUserId.value = userId;
  showBlockDialog.value = true;
}

function isLastItems(member: GroupMember) {
  const index = members.value.findIndex(
    (item) => item.user.id === member.user.id
  );
  return index === members.value.length - 1;
}

await fetchMembers();
</script>

<style scoped></style>
