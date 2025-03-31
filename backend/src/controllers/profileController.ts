import prisma from "@/libs/prisma";
import { validate, yup } from "@/libs/validate";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { Hono } from "hono";
import jwt from "jsonwebtoken";
import { getUTCTime } from "@/libs/time";
import { uploadImage } from "@/libs/uploadImage";
import profileMiddleware from "@/middlewares/profileMiddleware";
import { every } from "hono/combine";

const profileController = new Hono();

profileController.put(
  "/bio",
  every(authMiddleware, profileMiddleware),
  async (c) => {
    const { user } = c.var;
    const body = await validate(
      {
        bio: yup.string().required("Tiểu sử không được bỏ trống"),
      },
      await c.req.json()
    );

    await prisma.profile.update({
      where: {
        userId: user.id,
      },
      data: {
        bio: body.bio,
      },
    });

    return c.json({
      code: 200,
      message: "Cập nhật tiểu sử thành công",
    });
  }
);

profileController.put("/avatar", authMiddleware, async (c) => {
  const { user } = c.var;
  const formData = await c.req.parseBody();

  // Kiểm tra xem formData có chứa file hay không
  const avatarFile = formData["avatar"];

  if (!(avatarFile instanceof File)) {
    return c.json({ code: 400, message: "Invalid file format" });
  }
  try {
    // Chuyển file ảnh thành buffer
    const fileBuffer = Buffer.from(await avatarFile.arrayBuffer());

    // Lưu URL vào cơ sở dữ liệu
    const avatarUrl = await uploadImage(fileBuffer);

    await prisma.profile.update({
      where: { userId: user.id },
      data: { avatarUrl },
    });

    return c.json({
      code: 200,
      data: { avatarUrl },
      message: "Cập nhật ảnh đại diện thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({ code: 500, message: "Lỗi khi cập nhật ảnh đại diện" });
  }
});

profileController.put("/banner", authMiddleware, async (c) => {
  const { user } = c.var;
  const formData = await c.req.parseBody();

  // Kiểm tra xem formData có chứa file hay không
  const bannerFile = formData["banner"];

  if (!(bannerFile instanceof File)) {
    return c.json({ code: 400, message: "Invalid file format" });
  }

  try {
    // Chuyển file ảnh thành buffer
    const fileBuffer = Buffer.from(await bannerFile.arrayBuffer());

    // Lưu URL vào cơ sở dữ liệu
    const bannerUrl = await uploadImage(fileBuffer);

    await prisma.profile.update({
      where: { userId: user.id },
      data: { bannerUrl },
    });

    return c.json({
      code: 200,
      data: { bannerUrl },
      message: "Cập nhật ảnh bìa thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({ code: 500, message: "Lỗi khi cập nhật ảnh bìa" });
  }
});

export default profileController;
