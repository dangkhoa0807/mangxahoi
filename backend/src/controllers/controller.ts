import { Hono } from "hono";

const controller = new Hono();

import authController from "./authController";
controller.route("/auth", authController);

import userController from "./userController";
controller.route("/user", userController);

import postController from "./postController";
controller.route("/post", postController);

import commentController from "./commentController";
controller.route("/comment", commentController);

import friendController from "./friendController";
controller.route("/friend", friendController);

import profileController from "./profileController";
controller.route("/profile", profileController);

import groupController from "./groupController";
controller.route("/group", groupController);

import hashtagController from "./hashtagController";
controller.route("/hashtag", hashtagController);

import conversationController from "./conversationController";
controller.route("/conversations", conversationController);

import searchController from "./searchController";
controller.route("/search", searchController);

import settingsController from "./settingsController";
controller.route("/settings", settingsController);

import blockController from "./blockController";
controller.route("/block", blockController);

import followController from "./followController";
controller.route("/follow", followController);

import stickerController from "./stickerController";
controller.route("/sticker", stickerController);

import counterController from "./counterController";
controller.route("/counter", counterController);

// admin
import adminController from "./admin/controller";
controller.route("/admin", adminController);

export default controller;
