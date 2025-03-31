<template>
  <div class="bg-white rounded-lg p-4 shadow-sm mb-4 last:mb-0 relative">
    <div class="flex flex-col gap-3">
      <!-- Post Header -->
      <PostHeader
        :show-close="false"
        :post="post"
        :show-action-menu="true"
        :is-saved="isSaved"
        @on-report="visibleDialogReport = true"
        @on-save="onSavePost"
      ></PostHeader>

      <!-- Post Content -->
      <div v-if="post.title || post.content">
        <h3 class="font-semibold text-lg" v-if="post.title">
          {{ post.title }}
        </h3>
        <div v-html="post.content" v-if="post.content"></div>
      </div>
      <!-- Post Image -->
      <PostImage v-if="post.images.length" :images="post.images"></PostImage>

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

      <div v-if="post.hashTags.length">
        <span>Tags: </span>
        <NuxtLink
          v-for="(hashtag, index) in post.hashTags"
          :to="`/hashtag/${hashtag.hashtag.name}`"
          class="text-blue-500 hover:underline cursor-pointer me-1"
        >
          #{{ hashtag.hashtag.name
          }}<span v-if="index < post.hashTags.length - 1" class="text-zinc-700"
            >,</span
          >
        </NuxtLink>
      </div>

      <hr v-if="!post.originalPost" />

      <!-- Post Interact Count -->
      <InteractCount :post="post" />

      <!-- Post Action -->
      <PostAction
        :post="post"
        :is-liked="isLiked"
        @on-comment="showDialogComment()"
        @on-share="showDialogShare()"
        @on-reaction="onReaction"
      ></PostAction>
    </div>

    <PostModel
      v-model="visibleDialogComment"
      :post="post"
      :is-liked="isLiked"
      :like-count="likeCount"
      :is-saved="isSaved"
      @on-comment="showDialogComment()"
      @on-share="showDialogShare()"
      @on-reaction="onReaction"
      @on-save="onSavePost"
    ></PostModel>
    <PostShare v-model="visibleDialogShare" :post-id="post.id"></PostShare>
    <PostReport v-model="visibleDialogReport" :post-id="post.id"></PostReport>

    <PostReactions :post="post" v-model="showReactionPost" />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { Post } from "~/types/model";
import type { ApiResponse } from "~/types/api";

import PostHeader from "./PostHeader.vue";
import PostImage from "./PostImage.vue";
import PostModel from "./PostModel.vue";
import PostShare from "./PostShare.vue";
import PostAction from "./PostAction.vue";
import PostReport from "./PostReport.vue";
import PostReactions from "./PostReactions.vue";
import InteractCount from "./InteractCount.vue";

// Props
const props = defineProps({
  post: { type: Object as PropType<Post>, required: true },
});

const emit = defineEmits(["onReaction"]);

const visibleDialogComment = ref(false);
const visibleDialogShare = ref(false);
const visibleDialogReport = ref(false);

const isLiked = ref(props.post.isLiked ?? false);
const likeCount = ref(props.post._count.reactions);
const isSaved = ref(
  props.post.savedPost ? props.post.savedPost.length > 0 : false
);

const showReactionPost = ref(false);

// Reaction bài viết
async function onReaction(type: string) {
  try {
    const { data } = await useAPI<
      ApiResponse<{
        isReacted: boolean;
        reactionCount: number;
      }>
    >(`/api/post/${props.post.id}/reaction`, {
      method: "POST",
      body: {
        type,
      },
    });

    if (data.value?.code == 200) {
      likeCount.value = data.value.data.reactionCount;
      emit("onReaction", {
        postId: props.post.id,
        type,
        count: data.value.data.reactionCount,
        isReacted: data.value.data.isReacted,
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
  }
}

function showDialogShare() {
  visibleDialogShare.value = true;
}

function showDialogComment() {
  visibleDialogComment.value = true;
}

// Handle save post
function onSavePost(saved: boolean) {
  isSaved.value = saved;
}
</script>
