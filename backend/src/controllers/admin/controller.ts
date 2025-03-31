import { Hono } from "hono";
import userController from "./userController";
import profileController from "./profileController";
import banController from "./banController";
import reportController from "./reportController";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { authMiddleware } from "@/middlewares/authMiddleware";
import dashboardController from "./dashboardController";
import stickerController from "./stickerController";

const adminController = new Hono();

adminController.use("*", authMiddleware);
adminController.use("*", adminMiddleware);

adminController.route("/users", userController);
adminController.route("/profile", profileController);
adminController.route("/ban", banController);
adminController.route("/report", reportController);
adminController.route("/dashboard", dashboardController);
adminController.route("/sticker", stickerController);

export default adminController;
