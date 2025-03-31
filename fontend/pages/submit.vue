<template>
  <div>
    <div class="mx-auto w-full xl:w-9/12">
      <div class="bg-white rounded-md p-10 shadow-sm">
        <div class="font-semibold text-xl">Đăng bài</div>
        <div class="flex flex-col w-full items-center">
          <form @submit.prevent="handleSubmit" class="w-full mt-5">
            <InputText type="text" class="w-full" placeholder="Tựa đề" />
            <div class="my-5">
              <Button label="Tag tên" severity="secondary" rounded />
            </div>
            <Editor editorStyle="height: 50px" placeholder="Nhập nội dung" />
            <div class="flex flex-row-reverse mt-4">
              <Button
                label="Đăng bài"
                severity="primary"
                rounded
                type="submit"
              ></Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// Khai báo các biến để lưu dữ liệu input
const description = ref("");
const title = ref("");

// Hàm xử lý sự kiện submit
const handleSubmit = () => {
  // Log dữ liệu khi form được submit
  console.log("Title:", title.value);
  console.log("Description:", description.value);
};
</script>

<style></style>
