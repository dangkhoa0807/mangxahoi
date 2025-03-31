import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import {
  chatWebsocket,
  onlineUsers,
  websocket,
} from "./websocket/conversations";

import { Notification, Prisma } from "@prisma/client";
import { Cron } from "croner";
// Khởi tạo queue
// import "./queues/notificationQueue";

type user = Prisma.UserGetPayload<{}>;
type post = Prisma.PostGetPayload<{}>;
type profile = Prisma.ProfileGetPayload<{}>;
type group = Prisma.GroupGetPayload<{}>;

interface UserWithRole extends user {
  roles: string[];
  profile: profile;
}

declare module "hono" {
  interface ContextVariableMap {
    user: UserWithRole;
    userByID: {
      id: string;
      profile: {
        name: string;
        avatarUrl: string | null;
      } | null;
    };
    post: post;
    group: group;
  }
}

const app = new Hono().basePath("/api");
app.use("/*", cors());

import controller from "./controllers/controller";
import { twokWebsocket } from "./websocket/twok";

app.route("/", controller);
app.route("/ws/", chatWebsocket);
app.route("/ws/", twokWebsocket);

// Xử lý validate

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    if (err.message == "validate") {
      return new Response(JSON.stringify(err.cause), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }
  throw err;
});

// Xóa điểm tương tác của các tuần trước vào 0h ngày mỗi tuần
// new Cron("0 0 * * 1", { timezone: "UTC" }, cleanupOldScores);

// new Cron("*/1 * * * * *", { timezone: "UTC" }, () => {
//   const getAllOnlineUsers = onlineUsers.getAllConnections();
//   console.log(
//     `Hiện có ${Object.keys(getAllOnlineUsers).length} người online: ` +
//       Object.keys(getAllOnlineUsers).join(", ")
//   );
// });

export default {
  port: 4000,
  fetch: app.fetch,
  websocket,
};
