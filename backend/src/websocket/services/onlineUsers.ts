import { ServerWebSocket } from "bun";
import { WSContext } from "hono/ws";

type Connection = {
  ws: WSContext<ServerWebSocket>;
  userId: string;
  token: string;
  expiredAt?: number;
};

class OnlineUserManager {
  private connections: Record<string, Connection[]> = {};

  addConnection(userId: string, connection: Connection) {
    if (!this.connections[userId]) {
      this.connections[userId] = [];
    }
    this.connections[userId].push(connection);
  }

  removeConnection(userId: string) {
    if (this.connections[userId]) {
      this.connections[userId] = this.connections[userId].filter(
        (conn) => conn.userId !== userId
      );
      if (this.connections[userId].length === 0) {
        delete this.connections[userId];
      }
    }
  }

  getConnections(userId: string): Connection[] {
    return this.connections[userId] || [];
  }

  getAllConnections(): Record<string, Connection[]> {
    return this.connections;
  }

  isUserOnline(userId: string): boolean {
    return Boolean(this.connections[userId]?.length);
  }

  broadcastToUser(userId: string, message: any) {
    const userConnections = this.getConnections(userId);
    userConnections.forEach((connection) => {
      connection.ws.send(JSON.stringify(message));
    });
  }

  broadcastToUsers(userIds: string[], message: any) {
    userIds.forEach((userId) => {
      this.broadcastToUser(userId, message);
    });
  }

  broadcastToAll(message: any, excludeUserIds: string[] = []) {
    // console.log(
    //   "Online user: ",
    //   Object.keys(this.connections).map((userId) => userId)
    // );
    Object.keys(this.connections).forEach((userId) => {
      if (excludeUserIds.includes(userId)) return;
      // console.log("Broadcasting to user: ", userId);
      this.broadcastToUser(userId, message);
    });
  }
}

const onlineUsers = new OnlineUserManager();

export { onlineUsers };
