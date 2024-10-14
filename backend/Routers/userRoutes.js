import express from "express";
import {
  chatList,
  createUser,
  followRequest,
  getChat,
  getDetails,
  loginUser,
  searchUsers,
  sendChat,
  userStatus,
} from "../Controllers/usersControllers.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
const Route = express.Router();

Route.post("/create-user", createUser);

Route.post("/login", loginUser);

Route.get("/", authMiddleware, searchUsers);

Route.post("/follow-request", authMiddleware, followRequest);
Route.post("/user-status", authMiddleware, userStatus);
Route.get("/chat-list", authMiddleware, chatList);
Route.get("/details", authMiddleware, getDetails);
Route.post("/get-chat", authMiddleware, getChat);
Route.post("/send-chat", authMiddleware, sendChat);

export default Route;
