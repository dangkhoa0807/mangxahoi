<template>
  <div class="mx-auto w-full xl:w-9/12">
    <div class="bg-white rounded-md p-5 shadow-sm">
      <div class="font-semibold text-2xl mb-6">Điều khoản sử dụng</div>

      <div class="space-y-8">
        <div>
          <h2 class="text-xl font-semibold mb-3">1. Điều khoản chung</h2>
          <p class="text-gray-600 leading-relaxed">
            Bằng việc truy cập và sử dụng TWOK, bạn đồng ý tuân thủ và chịu ràng
            buộc bởi các điều khoản và điều kiện này. Nếu bạn không đồng ý với
            bất kỳ phần nào của điều khoản, vui lòng không sử dụng dịch vụ của
            chúng tôi.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-semibold mb-3">2. Tài khoản người dùng</h2>
          <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center gap-3 mb-2">
                <Icon name="tabler:user" class="text-2xl text-blue-600" />
                <h3 class="font-medium">Đăng ký tài khoản</h3>
              </div>
              <p class="text-gray-600">
                Bạn phải cung cấp thông tin chính xác và đầy đủ khi đăng ký tài
                khoản. Mỗi người dùng chỉ được phép tạo một tài khoản và chịu
                trách nhiệm bảo mật thông tin đăng nhập.
              </p>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center gap-3 mb-2">
                <Icon name="tabler:shield" class="text-2xl text-blue-600" />
                <h3 class="font-medium">Bảo mật</h3>
              </div>
              <p class="text-gray-600">
                Bạn có trách nhiệm duy trì tính bảo mật của tài khoản và mật
                khẩu. Thông báo ngay cho chúng tôi về bất kỳ hành vi sử dụng
                trái phép nào.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 class="text-xl font-semibold mb-3">3. Quy tắc ứng xử</h2>
          <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center gap-3 mb-2">
                <Icon
                  name="tabler:message-report"
                  class="text-2xl text-blue-600"
                />
                <h3 class="font-medium">Nội dung bị cấm</h3>
              </div>
              <p class="text-gray-600">
                Không đăng tải, chia sẻ nội dung vi phạm pháp luật, nội dung
                khiêu dâm, bạo lực, phân biệt đối xử hoặc xúc phạm người khác.
              </p>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center gap-3 mb-2">
                <Icon name="tabler:users" class="text-2xl text-blue-600" />
                <h3 class="font-medium">Tương tác cộng đồng</h3>
              </div>
              <p class="text-gray-600">
                Tôn trọng người khác, không quấy rối, đe dọa hoặc có hành vi gây
                hại đến cộng đồng.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 class="text-xl font-semibold mb-3">4. Vi phạm và xử lý</h2>
          <p class="text-gray-600 leading-relaxed">
            Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản của bạn nếu vi
            phạm các điều khoản sử dụng. Mọi hành vi vi phạm nghiêm trọng sẽ bị
            xử lý theo quy định của pháp luật.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-semibold mb-3">Liên hệ</h2>
          <p class="text-gray-600">
            Nếu bạn có bất kỳ thắc mắc nào về điều khoản sử dụng, vui lòng liên
            hệ:
          </p>
          <div class="mt-3 space-y-2">
            <div class="flex items-center gap-2">
              <Icon name="tabler:mail" class="text-gray-600" />
              <a
                href="mailto:terms@twok.erisvn.net"
                class="text-blue-600 hover:underline"
              >
                terms@twok.erisvn.net
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
  title: "Điều khoản sử dụng - TWOK",
});
</script>

<style scoped></style>
