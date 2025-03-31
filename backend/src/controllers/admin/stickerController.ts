import { Hono } from "hono";
import prisma from "@/libs/prisma";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { validate, yup } from "@/libs/validate";
import { uploadAnimatedWebP } from "@/libs/uploadImage";
import { ObjectId } from "bson";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { StickerPackStatus, StickerStatus } from "@prisma/client";

const stickerController = new Hono();

// Lấy danh sách pack sticker
stickerController.get("/packs", async (c) => {
  try {
    const query = await validate(
      {
        page: yup.number().min(1).default(1),
        limit: yup.number().min(1).max(100).default(10),
        search: yup.string().nullable(),
      },
      c.req.query()
    );

    const [packs, pagination] = await prisma.stickerPack
      .paginate({
        where: {
          status: {
            in: [StickerPackStatus.ACTIVE, StickerPackStatus.INACTIVE],
          },
          ...(query.search && {
            name: {
              contains: query.search,
              mode: "insensitive",
            },
          }),
        },
        include: {
          stickers: true,
          _count: {
            select: {
              stickers: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
      .withPages({
        page: parseInt(query.page),
        limit: parseInt(query.limit),
        includePageCount: true,
      });

    return c.json({
      code: 200,
      data: {
        list: packs,
        pagination: pagination,
      },
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi lấy danh sách sticker pack",
    });
  }
});

// Tạo pack sticker mới
stickerController.post("/packs", async (c) => {
  const formData = await c.req.parseBody();

  const coverFile = formData.cover as File;

  if (!(coverFile instanceof File)) {
    return c.json({ code: -100, message: "Ảnh bìa không hợp lệ" });
  }

  const body = await validate(
    {
      name: yup.string().required("Tên pack sticker không được bỏ trống"),
      status: yup.string().oneOf(["ACTIVE", "INACTIVE"]),
    },
    formData
  );

  try {
    const fileBuffer = Buffer.from(await coverFile.arrayBuffer());
    const coverUrl = await uploadAnimatedWebP(fileBuffer);

    const pack = await prisma.stickerPack.create({
      data: {
        name: body.name,
        description: body.description,
        coverUrl: coverUrl,
        status: body.status,
      },
      include: {
        _count: {
          select: {
            stickers: true,
          },
        },
      },
    });

    return c.json({
      code: 200,
      data: pack,
      message: "Tạo sticker pack thành công",
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi tạo sticker pack",
    });
  }
});

// Cập nhật pack sticker
stickerController.put("/packs/:id", async (c) => {
  const packId = c.req.param("id");
  const formData = await c.req.parseBody();

  if (!ObjectId.isValid(packId)) {
    return c.json({ code: -100, message: "ID sticker pack không hợp lệ" });
  }

  const body = await validate(
    {
      name: yup.string(),
      description: yup.string(),
      status: yup.string().oneOf(Object.values(StickerPackStatus)),
    },
    formData
  );

  try {
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.description) updateData.description = body.description;
    if (body.status) updateData.status = body.status;

    // Xử lý ảnh bìa nếu có
    const coverFile = formData.cover as File;
    if (coverFile instanceof File) {
      const fileBuffer = Buffer.from(await coverFile.arrayBuffer());
      updateData.coverUrl = await uploadAnimatedWebP(fileBuffer);
    }

    const pack = await prisma.stickerPack.update({
      where: { id: packId },
      data: updateData,
      include: {
        _count: {
          select: {
            stickers: true,
          },
        },
      },
    });

    return c.json({
      code: 200,
      data: pack,
      message: "Cập nhật sticker pack thành công",
    });
  } catch (error) {
    console.log(error);
    return c.json({
      code: -100,
      message: "Lỗi khi cập nhật sticker pack",
    });
  }
});

// Xóa pack sticker
stickerController.delete("/packs/:id", async (c) => {
  const packId = c.req.param("id");

  if (!ObjectId.isValid(packId)) {
    return c.json({ code: -100, message: "ID sticker pack không hợp lệ" });
  }

  try {
    await prisma.stickerPack.update({
      where: { id: packId },
      data: { status: "DELETED" },
    });

    return c.json({
      code: 200,
      message: "Xóa sticker pack thành công",
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi xóa sticker pack",
    });
  }
});

// Lấy danh sách sticker
stickerController.get("/", async (c) => {
  try {
    const query = await validate(
      {
        search: yup.string().nullable(),
        page: yup.number().min(1).default(1),
        limit: yup.number().min(1).max(100).default(10),
        packId: yup.string().nullable(),
      },
      c.req.query()
    );

    const [stickers, total] = await Promise.all([
      prisma.sticker.findMany({
        where: {
          status: {
            in: [StickerStatus.ACTIVE, StickerStatus.INACTIVE],
          },
          packId: query.packId ? query.packId : undefined,
          ...(query.search && {
            keywords: {
              hasSome: query.search
                .split(" ")
                .filter((k: string) => k.length > 0)
                .map((k: string) => k.toLowerCase()),
            },
          }),
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          pack: true,
        },
      }),
      prisma.sticker.count({
        where: {
          status: {
            in: [StickerStatus.ACTIVE, StickerStatus.INACTIVE],
          },
          packId: query.packId ? query.packId : undefined,
        },
      }),
    ]);

    return c.json({
      code: 200,
      data: {
        list: stickers,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi lấy danh sách sticker",
    });
  }
});

// Lấy danh sách tất cả gói sticker
stickerController.get("/all-packs", async (c) => {
  const packs = await prisma.stickerPack.findMany({
    where: {
      status: {
        in: [StickerPackStatus.ACTIVE, StickerPackStatus.INACTIVE],
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const list = packs.map((pack) => ({
    name: pack.name,
    code: pack.id,
  }));

  return c.json({
    code: 200,
    data: list,
  });
});

// Thêm sticker vào pack
stickerController.post("/", async (c) => {
  const formData = await c.req.parseBody();

  // Lấy file sticker
  const stickerFile = formData.image as File;

  if (!(stickerFile instanceof File)) {
    return c.json({ code: -100, message: "File sticker không hợp lệ" });
  }

  // Lấy từ khóa sticker
  let parsedKeywords: any = formData.keywords;
  if (typeof formData.keywords === "string" && formData.keywords !== "") {
    try {
      parsedKeywords = JSON.parse(formData.keywords);
    } catch (error) {
      return c.json({ code: -100, message: "Từ khóa không hợp lệ" });
    }
  } else {
    parsedKeywords = [];
  }

  const body = await validate(
    {
      packId: yup.string().required("Vui lòng chọn gói sticker"),
      keywords: yup
        .array()
        .of(
          yup.object({
            value: yup.string().required("Từ khóa không được bỏ trống"),
          })
        )
        .nullable(),
    },
    {
      ...formData,
      keywords: parsedKeywords,
    }
  );

  if (!ObjectId.isValid(body.packId)) {
    return c.json({ code: -100, message: "ID sticker pack không hợp lệ" });
  }

  try {
    const fileBuffer = Buffer.from(await stickerFile.arrayBuffer());
    const stickerUrl = await uploadAnimatedWebP(fileBuffer);

    const sticker = await prisma.sticker.create({
      data: {
        packId: body.packId,
        url: stickerUrl,
        keywords: body.keywords?.map((keyword: any) => keyword.value) || [],
      },
      include: {
        pack: true,
      },
    });

    return c.json({
      code: 200,
      data: sticker,
      message: "Thêm sticker thành công",
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi thêm sticker",
    });
  }
});

// Cập nhật sticker
stickerController.put("/:id", async (c) => {
  const stickerId = c.req.param("id");
  const formData = await c.req.parseBody();

  if (!ObjectId.isValid(stickerId)) {
    return c.json({ code: -100, message: "ID sticker không hợp lệ" });
  }

  // Lấy từ khóa sticker
  let parsedKeywords: any = formData.keywords;
  if (typeof formData.keywords === "string" && formData.keywords !== "") {
    try {
      parsedKeywords = JSON.parse(formData.keywords);
    } catch (error) {
      return c.json({ code: -100, message: "Từ khóa không hợp lệ" });
    }
  } else {
    parsedKeywords = [];
  }

  const body = await validate(
    {
      packId: yup.string().required("Vui lòng chọn gói sticker"),
      keywords: yup
        .array()
        .of(
          yup.object({
            value: yup.string().required("Từ khóa không được bỏ trống"),
          })
        )
        .nullable(),
      status: yup.string().oneOf(Object.values(StickerStatus)),
    },
    {
      ...formData,
      keywords: parsedKeywords,
    }
  );

  try {
    const updateData: any = {};
    if (body.packId) updateData.packId = body.packId;
    if (body.keywords)
      updateData.keywords = body.keywords.map((keyword: any) => keyword.value);
    if (body.status) updateData.status = body.status;

    // Xử lý ảnh sticker nếu có
    const stickerFile = formData.image as File;
    if (stickerFile instanceof File) {
      const fileBuffer = Buffer.from(await stickerFile.arrayBuffer());
      updateData.url = await uploadAnimatedWebP(fileBuffer);
    }

    const sticker = await prisma.sticker.update({
      where: { id: stickerId },
      data: updateData,
      include: {
        pack: true,
      },
    });

    return c.json({
      code: 200,
      data: sticker,
      message: "Cập nhật sticker thành công",
    });
  } catch (error) {
    console.log(error);
    return c.json({
      code: -100,
      message: "Lỗi khi cập nhật sticker",
    });
  }
});

// Xóa sticker
stickerController.delete("/:id", async (c) => {
  const stickerId = c.req.param("id");

  if (!ObjectId.isValid(stickerId)) {
    return c.json({ code: -100, message: "ID sticker không hợp lệ" });
  }

  try {
    await prisma.sticker.update({
      where: { id: stickerId },
      data: { status: StickerStatus.DELETED },
    });

    return c.json({
      code: 200,
      message: "Xóa sticker thành công",
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi xóa sticker",
    });
  }
});

export default stickerController;
