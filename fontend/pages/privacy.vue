<template>
  <div class="mx-auto w-full xl:w-9/12">
    <div class="bg-white rounded-md p-5 shadow-sm">
      <div class="font-semibold text-2xl mb-6">Quyền riêng tư</div>

      <div class="space-y-8">
        <div>
          <h2 class="text-xl font-semibold mb-3">Thông tin cá nhân</h2>
          <p class="text-gray-600 leading-relaxed">
            TWOK cam kết bảo vệ thông tin cá nhân của người dùng. Chúng tôi chỉ
            thu thập những thông tin cần thiết để vận hành dịch vụ và cải thiện
            trải nghiệm người dùng. Thông tin của bạn sẽ không được chia sẻ với
            bên thứ ba mà không có sự đồng ý.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-semibold mb-3">Quyền kiểm soát của bạn</h2>
          <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center gap-3 mb-2">
                <Icon name="tabler:eye" class="text-2xl text-blue-600" />
                <h3 class="font-medium">Kiểm soát nội dung</h3>
              </div>
              <p class="text-gray-600">
                Bạn có quyền kiểm soát ai có thể xem thông tin cá nhân, bài viết
                và hoạt động của mình thông qua cài đặt quyền riêng tư
              </p>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center gap-3 mb-2">
                <Icon
                  name="tabler:shield-lock"
                  class="text-2xl text-blue-600"
                />
                <h3 class="font-medium">Bảo mật tài khoản</h3>
              </div>
              <p class="text-gray-600">
                Bạn có thể quản lý các thiết bị đăng nhập, thay đổi mật khẩu và
                bật xác thực hai yếu tố để bảo vệ tài khoản
              </p>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center gap-3 mb-2">
                <Icon name="tabler:user-off" class="text-2xl text-blue-600" />
                <h3 class="font-medium">Chặn và hạn chế</h3>
              </div>
              <p class="text-gray-600">
                Bạn có thể chặn người dùng không mong muốn và hạn chế tương tác
                từ những người này
              </p>
            </div>
          </div>
        </div>

        <!-- <div>
          <h2 class="text-xl font-semibold mb-3">Dữ liệu của bạn</h2>
          <p class="text-gray-600 leading-relaxed mb-4">
            Bạn có thể yêu cầu một bản sao dữ liệu của mình hoặc xóa tài khoản
            bất cứ lúc nào. Khi xóa tài khoản, tất cả thông tin cá nhân của bạn
            sẽ bị xóa vĩnh viễn khỏi hệ thống của chúng tôi.
          </p>
          <NuxtLink
            to="/settings/privacy"
            class="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-150"
          >
            <Icon name="tabler:settings" />
            Quản lý cài đặt quyền riêng tư
          </NuxtLink>
        </div> -->

        <div>
          <h2 class="text-xl font-semibold mb-3">Liên hệ</h2>
          <p class="text-gray-600">
            Nếu bạn có bất kỳ thắc mắc nào về quyền riêng tư, vui lòng liên hệ
            với chúng tôi qua:
          </p>
          <div class="mt-3 space-y-2">
            <div class="flex items-center gap-2">
              <Icon name="tabler:mail" class="text-gray-600" />
              <a
                href="mailto:privacy@twok.erisvn.net"
                class="text-blue-600 hover:underline"
              >
                privacy@twok.erisvn.net
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "Quyền riêng tư - TWOK",
});
</script>

<style scoped></style>
