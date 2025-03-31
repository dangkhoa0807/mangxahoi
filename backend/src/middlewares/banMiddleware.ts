import { createMiddleware } from "hono/factory";
import prisma from "@/libs/prisma";
import { BanRestriction } from "@prisma/client";
import { getUTCTime } from "@/libs/time";

type Env = {
  Variables: {
    user: any;
  };
};

// Middleware to check if user is banned
const checkBanMiddleware = (restrictions: BanRestriction[]) =>
  createMiddleware<Env>(async (c, next) => {
    const { user } = c.var;

    if (!user) {
      return c.json({
        code: 401,
        message: "Vui lòng đăng nhập để tiếp tục",
      });
    }

    // Check for active bans
    const activeBan = await prisma.bannedUser.findFirst({
      where: {
        userId: user.id,
        restriction: {
          in: restrictions,
        },
        OR: [
          { endAt: null }, // Permanent ban
          { endAt: { gt: getUTCTime(new Date()) } }, // Temporary ban still active
        ],
      },
    });

    if (activeBan) {
      const banMessage = getBanMessage(activeBan.restriction, activeBan.endAt);
      return c.json({
        code: 403,
        message: banMessage,
        data: {
          restriction: activeBan.restriction,
          reason: activeBan.reason,
          endAt: activeBan.endAt,
        },
      });
    }

    await next();
  });

// Helper function to get ban message
function getBanMessage(
  restriction: BanRestriction,
  endAt: Date | null
): string {
  const baseMessages = {
    FULL_BAN: "Tài khoản của bạn đã bị khoá",
    COMMENT_BAN: "Bạn đã bị cấm bình luận",
    POST_BAN: "Bạn đã bị cấm đăng bài",
    REACTION_BAN: "Bạn đã bị cấm tương tác",
  };

  const baseMessage = baseMessages[restriction];
  if (!endAt) {
    return `${baseMessage} (Vĩnh viễn)`;
  }

  const daysRemaining = Math.ceil(
    (endAt.getTime() - getUTCTime(new Date()).getTime()) / (1000 * 60 * 60 * 24)
  );
  return `${baseMessage} (Còn ${daysRemaining} ngày)`;
}

// Specific middleware instances for different actions
const checkFullBan = checkBanMiddleware(["FULL_BAN"]);
const checkCommentBan = checkBanMiddleware(["FULL_BAN", "COMMENT_BAN"]);
const checkPostBan = checkBanMiddleware(["FULL_BAN", "POST_BAN"]);
const checkReactionBan = checkBanMiddleware(["FULL_BAN", "REACTION_BAN"]);

export { checkFullBan, checkCommentBan, checkPostBan, checkReactionBan };
