import prisma from "@/libs/prisma";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { Hono } from "hono";

const counterController = new Hono();

counterController.get("/unread", authMiddleware, async (c) => {
  const { user } = c.var;

  const unreadConversations = await prisma.unreadMessageCounter.count({
    where: {
      userId: user.id,
    },
  });

  const unreadNotifications = await prisma.notification.count({
    where: {
      userId: user.id,
      read: false,
    },
  });

  return c.json({
    code: 200,
    data: {
      unreadConversations,
      unreadNotifications,
    },
  });
});

export default counterController;
