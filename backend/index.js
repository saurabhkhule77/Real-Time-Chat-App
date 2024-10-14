import express from "express";
import dotenv from "dotenv";
import connection from "./DB/dbConfig.js";
import cors from "cors";
import Routes from "./Routers/userRoutes.js";
import cookieParser from "cookie-parser";
import authMiddleware from "./Middlewares/authMiddleware.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { send } from "process";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const corsOptions = {
  origin: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/api/user", Routes);

app.get("/api/user/info", authMiddleware, (req, res) => {});

const PORT = process.env.PORT || 3000;

const io = new Server(httpServer, {
  pingTimeout: 6000000,
  cors: {
    origin: "*",
  },
});
io.on("connection", (socket) => {
  socket.on("set up", ({ id }) => {
    socket.join(id);
    socket.emit("set up", "connected");
  });

  socket.on("join chat", ({ sender, receiver }) => {
    const room =
      sender > receiver ? sender + "R" + receiver : receiver + "R" + sender;
    socket.join(room);
    console.log("user joined room : " + room);
  });
  socket.on("new message", ({ message, sender, receiver }) => {
    const room =
      sender > receiver ? sender + "R" + receiver : receiver + "R" + sender;
    const sent_at = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    socket.in(room).emit("new message received", { message, sender, sent_at });
    socket.emit("new message received", { message, sender, sent_at });
  });
});
httpServer.listen(PORT, () => {
  console.log("App is listening on " + PORT);
});
