import prisma from "@/libs/prisma";
import { validate, yup } from "@/libs/validate";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { Hono } from "hono";
import { ObjectId } from "bson";

const profileController = new Hono();

profileController.get("/:id", async (c) => {
  const id = c.req.param("id");

  if (!ObjectId.isValid(id)) {
    return c.json({ code: -100, message: "ID không hợp lệ" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        profile: true,
      },
    });

    if (!user) {
      return c.json({ code: -100, message: "Không tìm thấy người dùng" });
    }

    if (!user.profile) {
      return c.json({ code: -101, message: "Người dùng chưa tạo profile" });
    }

    const profile = user.profile;

    return c.json({
      code: 200,
      data: profile,
    });
  } catch (error) {
    return c.json({ code: 500, message: "Lỗi khi lấy thông tin profile" });
  }
});

// Chỉnh sửa profile người dùng
profileController.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  if (!ObjectId.isValid(id)) {
    return c.json({ code: -100, message: "ID không hợp lệ" });
  }

  const body = await validate(
    {
      name: yup.string().required("Họ tên không được bỏ trống"),
      gender: yup
        .string()
        .required("Giới tính không được bỏ trống")
        .oneOf(["male", "female", "other"], "Giới tính không hợp lệ"),
      birthday: yup.date().required("Ngày sinh không được bỏ trống"),
      bio: yup.string().optional(),
    },
    await c.req.json()
  );

  try {
    const profile = await prisma.profile.update({
      where: { userId: id },
      data: {
        name: body.name,
        gender: body.gender,
        birthday: body.birthday,
        bio: body.bio,
      },
    });

    return c.json({
      code: 200,
      message: "Cập nhật profile thành công",
      data: profile,
    });
  } catch (error) {
    console.error(error);
    return c.json({ code: 500, message: "Lỗi khi cập nhật profile" });
  }
});

export default profileController;
