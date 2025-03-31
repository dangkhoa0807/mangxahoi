<template>
  <div>
    <Dialog
      v-model:visible="visibleDialog"
      modal
      :show-header="false"
      :pt="{
        root: 'pt-4',
        content: 'pb-0 h-full',
      }"
      :style="{ width: '46rem' }"
      dismissableMask
      blockScroll
      :maximizable="true"
      @show="loadComments()"
    >
      <!-- Posts Header -->
      <PostHeader
        @close="visibleDialog = false"
        class="sticky top-0 bg-white pb-4 z-10 border-b"
        :post="post"
        @on-save="onSavePost"
        :is-saved="isSaved"
      >
      </PostHeader>
      <div
        class="overflow-auto mb-4"
        style="max-height: calc(90vh - 320px)"
        @scroll="onScroll"
      >
        <div class="flex flex-col gap-3 mt-3">
          <!-- Posts Content -->
          <div>
            <h3 class="font-semibold text-lg">{{ post.title }}</h3>
            <div v-html="post.content" v-if="post.content"></div>
          </div>
          <!-- Posts Image -->
          <PostImage
            v-if="post.images.length"
            :images="post.images"
          ></PostImage>

          <!-- Shared Post -->
          <div
            v-if="post.originalPost"
            class="border rounded-md p-4 flex flex-col gap-3"
          >
            <!-- Shared Post Content -->
            <div v-if="post.originalPost.title || post.originalPost.content">
              <h3 class="font-semibold text-lg" v-if="post.originalPost.title">
                {{ post.originalPost.title }}
              </h3>
              <div
                v-html="post.originalPost.content"
                v-if="post.originalPost.content"
              ></div>
            </div>
            <!-- Shared Post Image -->
            <PostImage
              v-if="post.originalPost.images.length"
              :images="post.originalPost.images"
            ></PostImage>

            <hr />

            <PostHeader
              :show-close="false"
              :show-action-menu="false"
              :post="post.originalPost"
            ></PostHeader>
          </div>

          <hr v-if="!post.originalPost" />

          <!-- Posts Interact Count -->
          <InteractCount :post="post" />

          <!-- Posts Action -->
          <PostAction
            :post="post"
            :is-liked="isLiked"
            @on-reaction="
              (data) => {
                emit('onReaction', data);
              }
            "
            @on-comment="emit('onComment')"
            @on-share="emit('onShare')"
          ></PostAction>

          <hr />

          <!-- Menu Sort -->
          <div class="relative inline-block text-left">
            <button
              class="flex gap-1 items-center cursor-pointer w-fit"
              @click="showSortMenu"
            >
              {{ sortLabel }}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#545454"
                  stroke="#545454"
                  stroke-linejoin="round"
                  stroke-width="4"
                  d="M36 19L24 31L12 19z"
                />
              </svg>
            </button>
            <Popover ref="sortMenu">
              <div class="w-40">
                <div class="flex flex-col gap-1">
                  <div
                    class="flex items-center gap-3 p-2 hover:bg-gray-200 hover:text-gray-700 rounded-md cursor-pointer"
                    :class="{ 'bg-blue-500 text-white': sortBy === 'newest' }"
                    @click="setSortBy('newest')"
                  >
                    Mới nhất
                  </div>
                  <div
                    class="flex items-center gap-3 p-2 hover:bg-gray-200 hover:text-gray-700 rounded-md cursor-pointer"
                    :class="{ 'bg-blue-500 text-white': sortBy === 'oldest' }"
                    @click="setSortBy('oldest')"
                  >
                    Cũ nhất
                  </div>
                  <div
                    class="flex items-center gap-3 p-2 hover:bg-gray-200 hover:text-gray-700 rounded-md cursor-pointer"
                    :class="{ 'bg-blue-500 text-white': sortBy === 'popular' }"
                    @click="setSortBy('popular')"
                  >
                    Nổi bật
                  </div>
                </div>
              </div>
            </Popover>
          </div>

          <!-- Danh sách Comments -->
          <CommentList
            :post="post"
            :comments="comments"
            @delete-comment="deleteComment"
            @like-comment="likeComment"
            @fetched-replies="fetchedReplies"
            @edited-comment="editedComment"
            @post-reply="postComment"
          ></CommentList>
        </div>
      </div>

      <hr class="my-3" />
      <!-- Comment Box Sticky -->
      <CreateComment
        v-model="comment"
        @postComment="postComment"
      ></CreateComment>
    </Dialog>

    <Loading v-model="isLoading" />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import PostHeader from "./PostHeader.vue";
import PostImage from "./PostImage.vue";
import { type Comment, type Post } from "~/types/model";
import PostAction from "./PostAction.vue";
import InteractCount from "./InteractCount.vue";
import Loading from "~/components/Dialog/Loading.vue";
import CreateComment from "../Comment/CreateComment.vue";
import CommentList from "../Comment/CommentList.vue";

const auth = useAuth();
const toast = useToast();

const visibleDialog = defineModel({
  default: false,
});

const props = defineProps({
  post: { type: Object as PropType<Post>, required: true },
  isLiked: { type: Boolean, default: false },
  likeCount: { type: Number },
  isSaved: { type: Boolean, default: false },
});

const emit = defineEmits(["onShare", "onComment", "onReaction", "onSave"]);

const isLoading = ref(false);

// Đăng bình luận
const comment = ref<string>("");
async function postComment({
  content,
  image,
  parentId,
  stickerId,
}: {
  content: string;
  image: File | null;
  parentId: string | null;
  stickerId: string | null;
}) {
  try {
    isLoading.value = true;

    const formData = new FormData();
    formData.append("content", content || "");
    if (image) formData.append("image", image);
    formData.append("postId", props.post.id);
    if (parentId) formData.append("parentId", parentId);
    if (stickerId) formData.append("stickerId", stickerId);

    const { data } = await useAPI<ApiResponse<Comment>>(`/api/comment`, {
      method: "POST",
      body: formData,
    });

    if (data.value?.code == 200) {
      if (parentId) {
        replyComment({ commentId: parentId, comment: data.value.data });
      } else {
        comments.value.unshift(data.value.data);
      }
      comment.value = "";
      toast.success(data.value?.message ?? "Lấy dữ liệu thất bại");
    } else {
      toast.error(data.value?.message ?? "Lấy dữ liệu thất bại");
    }
  } catch (error) {
    toast.error("Lấy dữ liệu thất bại");
  } finally {
    isLoading.value = false;
  }
}

// Xử lý bình luận
const comments = ref<Comment[]>([]);
const commentCursor = ref<string | null>(null);
const isLoadingComment = ref(false);
const hasMoreComments = ref(true);

// Tải comment
async function loadComments() {
  if (isLoadingComment.value || !hasMoreComments.value) return;

  isLoadingComment.value = true;

  const { data } = await useAPI<
    ApiResponse<{
      comments: Comment[];
      hasMore: boolean;
      cursor: string | null;
    }>
  >(`/api/comment`, {
    method: "GET",
    params: {
      cursor: commentCursor.value,
      postId: props.post.id,
      sortBy: sortBy.value,
    },
  });

  isLoadingComment.value = false;

  if (data.value?.code === 200) {
    if (commentCursor.value === null) {
      comments.value = data.value.data.comments;
    } else {
      comments.value.push(...data.value.data.comments);
    }
    hasMoreComments.value = data.value.data.hasMore;
    commentCursor.value = data.value.data.cursor;
  }
}

// Thêm reply comment vào ui
async function replyComment(data: { commentId: string; comment: Comment }) {
  // Tìm comment cần thêm reply
  const commentIndex = comments.value.findIndex(
    (comment) => comment.id === data.commentId
  );

  if (commentIndex !== -1) {
    // Thêm reply mới vào comment đã chọn
    comments.value[commentIndex].replies.push(data.comment);
  }
}

// Sửa bình luận
async function editedComment(data: Comment) {
  // Kiểm tra và cập nhật bình luận chính
  const commentIndex = comments.value.findIndex(
    (comment) => comment.id === data.id
  );

  if (commentIndex !== -1) {
    comments.value[commentIndex].content = data.content;
    comments.value[commentIndex].sticker = data.sticker;
    comments.value[commentIndex].image = data.image;
    return;
  }

  // Kiểm tra và cập nhật reply
  comments.value.forEach((comment) => {
    const replyIndex = comment.replies.findIndex(
      (reply) => reply.id === data.id
    );
    if (replyIndex !== -1) {
      comment.replies[replyIndex].content = data.content;
      comment.replies[replyIndex].sticker = data.sticker;
      comment.replies[replyIndex].image = data.image;
    }
  });
}

// Xóa bình luận
async function deleteComment(commentId: string) {
  comments.value = comments.value.reduce((acc, comment) => {
    // Nếu comment chính bị xóa
    if (comment.id === commentId) {
      return acc;
    }

    // Kiểm tra replies
    const hasDeletedReply = comment.replies.some(
      (reply) => reply.id === commentId
    );
    if (hasDeletedReply) {
      // Nếu có reply bị xóa, cập nhật comment
      acc.push({
        ...comment,
        replies: comment.replies.filter((reply) => reply.id !== commentId),
        _count: {
          ...comment._count,
          replies: comment._count.replies - 1,
        },
      });
    } else {
      // Không có thay đổi, giữ nguyên comment
      acc.push(comment);
    }

    return acc;
  }, [] as Comment[]);
}

// Khi cuộng cuối trang sẽ tải thêm bình luận
function onScroll(event: Event) {
  const target = event.target as HTMLElement;

  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
    loadComments();
  }
}

// Tải replies
async function fetchedReplies(data: {
  commentId: string;
  replies: Comment[];
  hasMore: boolean;
  page: number;
}) {
  const commentIndex = comments.value.findIndex(
    (comment) => comment.id === data.commentId
  );

  if (commentIndex !== -1) {
    comments.value[commentIndex].replies.push(...data.replies);
  }
}

// Like bài viết
async function likeComment(data: {
  commentId: string;
  isLiked: boolean;
  likesCount: number;
}) {
  const { commentId, isLiked, likesCount } = data;

  comments.value.forEach((comment) => {
    if (comment.id === commentId) {
      // Cập nhật bình luận chính
      comment.isLiked = isLiked;
      comment._count.reactions = likesCount;
    } else if (comment.replies) {
      // Tìm trong các reply nếu có
      const reply = comment.replies.find((r) => r.id === commentId);
      if (reply) {
        reply.isLiked = isLiked;
        reply._count.reactions = likesCount;
      }
    }
  });
}

// Lưu bài viết
async function onSavePost(saved: boolean) {
  console.log(saved);
  emit("onSave", saved);
}

// Sắp xếp
const sortBy = ref("newest");
const sortLabel = computed(() => {
  switch (sortBy.value) {
    case "newest":
      return "Mới nhất";
    case "oldest":
      return "Cũ nhất";
    case "popular":
      return "Nổi bật";
    default:
      return "Mới nhất";
  }
});

const sortMenu = ref();

function showSortMenu(event: Event) {
  sortMenu.value?.toggle(event);
}

function setSortBy(value: "newest" | "oldest" | "popular") {
  sortBy.value = value;
  sortMenu.value?.hide();

  // Reset pagination and reload comments
  commentCursor.value = null;
  hasMoreComments.value = true;
  loadComments();
}

// Xử lý realtime bình luận
onMounted(() => {
  useListen("newComment", (data) => {
    const comment = data as Comment;
    // Kiểm tra xem bình luận có phải của bài viết này không
    if (comment.postId === props.post.id) {
      // Kiểm tra xem bình luận có phải là reply không
      if (comment.parentId) {
        replyComment({ commentId: comment.parentId, comment });
      } else {
        comments.value.unshift(comment);
      }
    }
  });

  useListen("deleteComment", (data) => {
    const comment = data as Comment;

    deleteComment(comment.id);
  });

  useListen("updateComment", (data) => {
    const comment = data as Comment;
    editedComment(comment);
  });
});

onUnmounted(() => {
  removeListen("newComment");
  removeListen("deleteComment");
  removeListen("updateComment");
});
</script>

<style lang="scss">
.no-overflow {
  overflow-y: unset !important;
}
</style>
