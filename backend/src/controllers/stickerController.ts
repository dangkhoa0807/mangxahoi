import { Hono } from "hono";
import prisma from "@/libs/prisma";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { StickerPackStatus } from "@prisma/client";

const stickerController = new Hono();

// Lấy danh sách pack sticker
stickerController.get("/packs", async (c) => {
  try {
    const packs = await prisma.stickerPack.findMany({
      where: {
        status: StickerPackStatus.ACTIVE,
      },
      include: {
        stickers: {
          where: {
            status: "ACTIVE",
          },
        },
        _count: {
          select: {
            stickers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return c.json({
      code: 200,
      data: packs,
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi lấy danh sách sticker pack",
    });
  }
});

// Lấy chi tiết pack sticker
stickerController.get("/packs/:id", async (c) => {
  const packId = c.req.param("id");

  try {
    const pack = await prisma.stickerPack.findFirst({
      where: {
        id: packId,
        status: StickerPackStatus.ACTIVE,
      },
      include: {
        stickers: {
          where: {
            status: "ACTIVE",
          },
        },
      },
    });

    if (!pack) {
      return c.json({
        code: -100,
        message: "Không tìm thấy gói sticker",
      });
    }

    return c.json({
      code: 200,
      data: pack,
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi lấy thông tin gói sticker",
    });
  }
});

// Tìm kiếm sticker
stickerController.get("/search", async (c) => {
  const query = c.req.query();
  const keyword = query.search || "";
  const cursor = query.cursor;
  const limit = parseInt(query.limit || "10");

  try {
    const stickers = await prisma.sticker.findMany({
      where: {
        status: "ACTIVE",
        pack: {
          status: StickerPackStatus.ACTIVE,
        },
        keywords: {
          hasSome: keyword
            .split(" ")
            .filter((k) => k.length > 0)
            .map((k) => k.toLowerCase()),
        },
      },
      include: {
        pack: true,
      },
      cursor: cursor ? { id: cursor } : undefined,
      take: limit + 1,
      orderBy: {
        createdAt: "desc",
      },
    });

    const nextCursor =
      stickers.length > limit ? stickers[stickers.length - 1].id : null;
    const hasMore = stickers.length > limit;
    const list = stickers.slice(0, limit);

    return c.json({
      code: 200,
      data: {
        list,
        nextCursor,
        hasMore,
      },
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi tìm kiếm sticker",
    });
  }
});

export default stickerController;
