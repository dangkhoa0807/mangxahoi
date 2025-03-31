import prisma from "@/libs/prisma";
import { Prisma } from "@prisma/client";
import { createMiddleware } from "hono/factory";

type ProfileType = Prisma.ProfileGetPayload<{}>;

type Env = {
  Variables: {
    profile: ProfileType;
  };
};

const profileMiddleware = createMiddleware<Env>(async (c, next) => {
  const { user } = c.var;

  if (!user) {
    return c.json({ code: -401, message: "Vui lòng đăng nhập để tiếp tục" });
  }

  const profile = await prisma.profile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!profile) {
    return c.json({ code: -100, message: "Vui lòng tạo hồ sơ để thực hiện" });
  }

  await next();
});

export default profileMiddleware;
