<template>
  <!-- Danh sách bình luận -->
  <div class="comment-list-container">
    <div v-if="!comments.length">Chưa có bình luận nào</div>

    <div class="mx-auto my-2" v-else>
      <!-- Container bình luận -->
      <div
        class="flex items-start space-x-3 mb-2 last:mb-0 group"
        v-for="comment in comments"
        :key="comment.id"
      >
        <!-- Avatar người bình luận -->
        <div class="w-11 h-11 rounded-full bg-gray-200">
          <img
            :src="
              comment.user.profile.avatarUrl ??
              'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
            "
            alt="Avatar"
            class="rounded-full w-full h-full object-cover"
          />
        </div>

        <!-- Nội dung bình luận -->
        <div class="flex-1">
          <div
            class="rounded-lg px-4 py-2 w-fit bg-gray-100"
            :class="[
              comment.content ? 'bg-gray-100' : 'bg-white',
              comment.content && comment.image ? 'mb-2' : '',
            ]"
          >
            <div class="flex items-center space-x-2">
              <h3 class="font-semibold text-sm">
                {{ comment.user.profile.name }}
              </h3>
              <span class="text-xs text-gray-500">
                <FromNow :datetime="comment.createdAt"></FromNow>
              </span>
            </div>
            <div class="text-sm text-gray-700 mt-1">
              <div v-html="comment.content"></div>
            </div>
          </div>

          <!-- Hình ảnh -->
          <div
            v-if="comment.image"
            class="w-fit bg-white border rounded-lg h-fit"
          >
            <PostImage
              :images="[{ url: comment.image, file: null }]"
              class="max-w-52 object-cover"
            />
          </div>
          <div v-if="comment.sticker">
            <img
              :src="comment.sticker.url"
              alt="Sticker"
              class="w-24 h-fit object-cover"
            />
          </div>

          <div class="text-sm mt-2" v-if="comment._count.reactions">
            {{ comment._count.reactions }} lượt thích
          </div>

          <!-- Chức năng bình luận -->
          <div class="flex space-x-4 mt-2 text-xs text-zinc-500">
            <button
              class="hover:underline"
              @click="likeComment(comment.id)"
              :class="[comment.isLiked ? 'text-blue-500' : 'text-zinc-500']"
            >
              {{ comment.isLiked ? "Đã thích" : "Thích" }}
            </button>
            <button class="hover:underline" @click="toggleReply(comment.id)">
              Trả lời
            </button>
            <button
              class="justify-center items-center hover:bg-zinc-100 rounded-xl w-4 h-4 group-hover:flex hidden"
              @click="showActionMenu($event, comment)"
            >
              <Icon name="tabler:dots" class="text-zinc-900 text-sm"></Icon>
            </button>
          </div>

          <!-- Trả lời -->
          <div class="mt-4 space-y-3" v-if="comment.replies?.length">
            <ReplyComment
              v-for="reply in comment.replies"
              :key="reply.id"
              :reply="reply"
              :commentId="comment.id"
              @toggleReply="toggleReply"
              @showActionMenu="showActionMenu"
              @like-comment="likeComment"
            />

            <button
              v-if="hasMoreReplies[comment.id]"
              @click="loadMoreReplies(comment.id)"
              class="text-sm mt-2 cursor-pointer hover:text-blue-500 w-fit"
            >
              Tải thêm trả lời
            </button>
          </div>

          <!-- Nhập trả lời -->
          <CreateComment
            class="mt-2"
            v-if="replyInput[comment.id]"
            v-model="replyContent[comment.id]"
            v-model:image="replyImage[comment.id]"
            @postComment="
              (data) => {
                postReply(comment.id, data.content, data.image, data.stickerId);
              }
            "
          ></CreateComment>

          <div
            class="text-sm mt-2 cursor-pointer hover:text-blue-500 w-fit"
            v-if="comment._count.replies > 0 && !comment.replies?.length"
            @click="fetchReplies(comment.id)"
          >
            <span v-if="loadingReplies[comment.id]">Đang tải...</span>
            <span v-else> Xem {{ comment._count.replies }} trả lời </span>
          </div>
        </div>
      </div>

      <!-- Menu chức năng bình luận -->
      <Popover ref="commentActionMenu">
        <div class="w-[13rem]">
          <div class="flex flex-col gap-1">
            <div
              v-if="currentComment?.user.id === auth.user?.id"
              class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
              @click="showEditDialog"
            >
              <Icon name="tabler:edit" class="text-2xl text-zinc-600"></Icon>
              Sửa bình luận
            </div>
            <div
              v-if="
                currentComment?.user.id == auth.user?.id ||
                post.user.id == auth.user?.id
              "
              class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
              @click="visibleConfirmDelete = true"
            >
              <Icon name="tabler:trash" class="text-2xl text-zinc-600"></Icon>
              Xoá bình luận
            </div>
            <div
              v-if="currentComment?.user.id !== auth.user?.id"
              class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
              @click="visibleDialogReport = true"
            >
              <Icon
                name="tabler:message-report"
                class="text-2xl text-zinc-600"
              ></Icon>
              Báo cáo bình luận
            </div>
          </div>
        </div>
      </Popover>

      <!-- Xác nhận xoá bình luận -->
      <Dialog
        v-model:visible="visibleConfirmDelete"
        modal
        :showHeader="false"
        :style="{ width: '25rem' }"
      >
        <div class="flex flex-col items-center w-full gap-4 my-5">
          <Icon
            name="fluent:info-32-regular"
            class="!text-6xl text-primary-500"
          ></Icon>
          <p>Bạn có chắc muốn xoá bình luận này?</p>
        </div>
        <div class="flex justify-center gap-2">
          <Button
            type="button"
            label="Thôi"
            severity="secondary"
            :outlined="true"
            @click="visibleConfirmDelete = false"
          ></Button>
          <Button
            type="button"
            severity="danger"
            label="Xoá"
            @click="deleteComment(currentComment?.id ?? '')"
          ></Button>
        </div>
      </Dialog>

      <CommentReport
        v-model="visibleDialogReport"
        :comment-id="currentComment?.id ?? ''"
      ></CommentReport>

      <EditComment
        v-if="showEdit"
        v-model="showEdit"
        :comment="currentComment ?? null"
        @edited="(e: Comment) => emit('editedComment', e)"
      />

      <Loading v-model="isLoading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { ApiResponse } from "~/types/api";
import type { Comment, Post } from "~/types/model";
import FromNow from "../FromNow.vue";
import ReplyComment from "./ReplyComment.vue";
import CommentReport from "~/components/Comment/Dialog/Report.vue";
import EditComment from "~/components/Comment/Dialog/EditComment.vue";
import Loading from "~/components/Dialog/Loading.vue";
import CreateComment from "./CreateComment.vue";
import PostImage from "../Post/PostImage.vue";
import { data } from "autoprefixer";

const showEdit = ref(false);
const currentComment = ref<Comment | null>(null);

const isLoading = ref(false);
function showEditDialog() {
  showEdit.value = true;
}

// Auth
const auth = useAuth();

// Toast
const toast = useToast();

const props = defineProps({
  post: { type: Object as PropType<Post>, required: true },
  comments: { type: Object as PropType<Comment[]>, required: true },
});

// Emits
const emit = defineEmits([
  "newComment",
  "deleteComment",
  "likeComment",
  "fetchedReplies",
  "editedComment",
  "postReply",
]);

const replyInput = ref<{ [key: string]: boolean }>({});
const replyContent = ref<{ [key: string]: string }>({});
const replyImage = ref<{ [key: string]: string }>({});

// Hiện nhập trả lời
function toggleReply(commentId: string) {
  for (const key in replyInput.value) {
    if (key !== commentId) {
      replyInput.value[key] = false;
    }
  }
  replyInput.value[commentId] = !replyInput.value[commentId];
}

async function postReply(
  commentId: string,
  content: string,
  image: File | null,
  stickerId: string | null
) {
  emit("postReply", { content, image, parentId: commentId, stickerId });
}

// Xác nhận xoá bình luận
const visibleConfirmDelete = ref(false);
const commentActionMenu = ref();

// Xoá bình luận
async function deleteComment(commentId: string) {
  try {
    isLoading.value = true;
    const { data } = await useAPI<ApiResponse<Comment>>(
      `/api/comment/${commentId}`,
      {
        method: "DELETE",
        body: {
          postId: props.post.id,
        },
      }
    );

    if (data.value?.code === 200) {
      visibleConfirmDelete.value = false;
      emit("deleteComment", commentId);
      toast.success("Đã xóa bình luận thành công");
    } else {
      toast.error(data.value?.message ?? "Xóa bình luận thất bại");
    }
  } finally {
    isLoading.value = false;
  }
}

// Ẩn menu chức năng bình luận
async function hideActionMenu() {
  await commentActionMenu.value?.hide();
  currentComment.value = null;
}

// Hiện menu chức năng bình luận
async function showActionMenu(event: Event, comment: Comment) {
  await hideActionMenu();
  commentActionMenu.value?.toggle(event);
  currentComment.value = comment;
}

// Thích bình luận
async function likeComment(commentId: string) {
  const { data } = await useAPI<
    ApiResponse<{
      isLiked: boolean;
      likesCount: number;
    }>
  >(`/api/comment/${commentId}/like`, { method: "POST" });

  if (data.value?.code == 200) {
    emit("likeComment", {
      commentId,
      isLiked: data.value.data.isLiked,
      likesCount: data.value.data.likesCount,
    });
  } else {
    toast.error(data.value?.message ?? "Thích bình luận thất bại");
  }
}

const visibleDialogReport = ref(false);

// Tải các trả lời
const loadingReplies = ref<{ [key: string]: boolean }>({});
const hasMoreReplies = ref<{ [key: string]: boolean }>({});
const replyPage = ref<{ [key: string]: number }>({});

// Tải các trả lời
async function fetchReplies(commentId: string) {
  if (loadingReplies.value[commentId]) return;

  loadingReplies.value[commentId] = true;
  // Initialize page if not exists
  if (!replyPage.value[commentId]) {
    replyPage.value[commentId] = 1;
  }

  try {
    const { data } = await useAPI<
      ApiResponse<{
        list: Comment[];
        hasMore: boolean;
      }>
    >(`/api/comment/${commentId}/replies`, {
      method: "GET",
      query: {
        page: replyPage.value[commentId],
        pageSize: 5,
      },
    });

    if (data.value?.code === 200) {
      emit("fetchedReplies", {
        commentId,
        replies: data.value.data.list,
        hasMore: data.value.data.hasMore,
        page: replyPage.value[commentId],
      });
      hasMoreReplies.value[commentId] = data.value.data.hasMore;
    }
  } catch (error) {
    toast.error("Không thể tải các câu trả lời");
  } finally {
    loadingReplies.value[commentId] = false;
  }
}

async function loadMoreReplies(commentId: string) {
  replyPage.value[commentId]++;
  await fetchReplies(commentId);
}
</script>
