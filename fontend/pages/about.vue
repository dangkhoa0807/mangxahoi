<template>
  <div class="mx-auto w-full xl:w-9/12">
    <div class="bg-white rounded-md p-6 shadow-sm">
      <div class="font-semibold text-2xl mb-6">Giới thiệu</div>

      <div class="space-y-6">
        <div>
          <h2 class="text-xl font-semibold mb-3">Về TWOK</h2>
          <p class="text-gray-600 leading-relaxed">
            TWOK là một nền tảng mạng xã hội được thiết kế để kết nối mọi người
            với nhau. Chúng tôi cung cấp một không gian nơi bạn có thể chia sẻ
            những khoảnh khắc, tham gia các cộng đồng và kết nối với những người
            có cùng sở thích.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-semibold mb-3">Tính năng chính</h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center gap-3 mb-2">
                <Icon name="tabler:users" class="text-2xl text-blue-600" />
                <h3 class="font-medium">Kết nối bạn bè</h3>
              </div>
              <p class="text-gray-600">
                Kết nối và chia sẻ với bạn bè, gia đình và những người có cùng
                sở thích
              </p>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center gap-3 mb-2">
                <Icon name="tabler:messages" class="text-2xl text-blue-600" />
                <h3 class="font-medium">Trò chuyện</h3>
              </div>
              <p class="text-gray-600">
                Nhắn tin trực tiếp với bạn bè của bạn một cách dễ dàng
              </p>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center gap-3 mb-2">
                <Icon
                  name="tabler:users-group"
                  class="text-2xl text-blue-600"
                />
                <h3 class="font-medium">Cộng đồng</h3>
              </div>
              <p class="text-gray-600">
                Tham gia các nhóm với những người có cùng sở thích và đam mê
              </p>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center gap-3 mb-2">
                <Icon name="tabler:photo" class="text-2xl text-blue-600" />
                <h3 class="font-medium">Chia sẻ khoảnh khắc</h3>
              </div>
              <p class="text-gray-600">
                Đăng tải và chia sẻ những khoảnh khắc đáng nhớ của bạn
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 class="text-xl font-semibold mb-3">Liên hệ</h2>
          <p class="text-gray-600">
            Nếu bạn có bất kỳ câu hỏi hoặc góp ý nào, vui lòng liên hệ với chúng
            tôi qua:
          </p>
          <div class="mt-3 space-y-2">
            <div class="flex items-center gap-2">
              <Icon name="tabler:mail" class="text-gray-600" />
              <a
                href="mailto:support@twok.erisvn.net"
                class="text-blue-600 hover:underline"
                >support@twok.erisvn.net</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "Giới thiệu - TWOK",
});
</script>

<style scoped></style>
