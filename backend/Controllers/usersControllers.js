import database from "../DB/dbConfig.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const createUser = async (req, res) => {
  const { name, email, password, profile } = req.body;

  try {
    const [count] = await database.query(
      "SELECT COUNT(*) As count FROM users where email=?",
      [email]
    );

    if (count[0]?.count > 0)
      return res
        .status(409)
        .json({ message: "User Already Exist", data: null });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await database.query(
      "INSERT INTO users (name, email, password,profile) VALUES (?,?,?,?)",
      [name, email, hashedPassword, profile]
    );
    const userId = await database.query(
      "SELECT id from users WHERE email = ?",
      [email]
    );
    const [[{ id }]] = userId;
    const authToken = jwt.sign({ id, email }, process.env.JWT_SECREAT_KEY, {
      expiresIn: "1d",
    });

    res.cookie("authToken", authToken, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res
      .status(200)
      .json({ message: "User created successfully", data: {} });
  } catch (error) {}
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const userInfo = await database.query("SELECT * from users WHERE email = ?", [
    email,
  ]);
  const [[{ id, name, email: userEmail, password: userPassword }]] = userInfo;
  const isMatched = await bcrypt.compare(password, userPassword);

  if (isMatched) {
    const token = jwt.sign({ id, userEmail }, process.env.JWT_SECREAT_KEY, {
      expiresIn: "1d",
    });
    res.cookie("authToken", token, {
      httponly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res
      .status(200)
      .json({ message: "logined successfully", data: { id, name, email } });
  } else {
    res.status(401).json({ message: "Invalid Credentials" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const data = await database.query(
      "SELECT id, name, email, profile FROM users WHERE name LIKE ?",
      [`%${search}%`]
    );
    const [users] = data;
    return res
      .status(200)
      .json({ message: "users fetch successfully", data: [users] });
  } catch (err) {}
};
export const followRequest = async (req, res) => {
  try {
    const { id: receiverId, userId } = req.body;

    await database.query(
      "INSERT INTO friend_requests (sender_id, receiver_id,status) VALUES (?,?,?)",
      [userId, receiverId, "pending"]
    );
    res.status(200).json({ message: "Request Sent Successfully", data: true });
  } catch (err) {
    res.status(500).json({ message: "Internal Server error", data: null });
  }
};
export const userStatus = async (req, res) => {
  try {
    const { id, userId } = req.body;

    const data = await database.query(
      "SELECT request_id, status, requested_at, accepted_at FROM friend_requests WHERE sender_id=? AND receiver_id=?",
      [userId, id]
    );
    let out = null;
    if (data.length > 1) out = data[0][0];
    return res.status(200).json({ message: "success", data: out });
  } catch (err) {}
};
export const chatList = async (req, res) => {
  try {
    const data = await database.query(
      "select u.id, u.name, u.email, u.profile, c.latest_sent_at from (SELECT receiver_id, MAX(sent_at) AS latest_sent_at FROM chat WHERE sender_id = ? GROUP BY receiver_id) c join users u on c.receiver_id = u.id ORDER BY latest_sent_at DESC",
      [req.headers["userId"]]
    );
    return res.status(200).json({ message: "success", data: data[0] });
  } catch (err) {
    return res.status(500).json({ message: err, data: null });
  }
};
export const getChat = async (req, res) => {
  const userId = req.body.userId;
  const friendId = req.body.id;

  const sender = await database.query(
    "SELECT sender_id, message, sent_at FROM quick_chat.chat where (sender_id=? and receiver_id=?) or (sender_id=? and receiver_id=?) order by sent_at asc;",
    [userId, friendId, friendId, userId]
  );

  const data = sender[0]?.map((item, index) => {
    const date = new Date(item.sent_at);

    return {
      ...item,
      sent_at: date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      sender_id: item.sender_id == userId ? true : false,
      timestamp: item.sent_at,
    };
  });
  return res.status(200).json({ message: "success", data });
};
export const sendChat = async (req, res) => {
  try {
    const userId = req.body.userId;
    const friendId = req.body.id;
    const message = req.body.message;

    console.log(userId, friendId, message);

    await database.query(
      "INSERT INTO chat (sender_id, receiver_id, message) VALUES (?, ?, ?)",
      [userId, friendId, message]
    );
    res.status(200).json({});
  } catch (err) {
    res.status(500).json({});
    console.log(err);
  }
};

export const getDetails = async (req, res) => {
  try {
    const data = await database.query(
      "SELECT name, email, profile, id from users WHERE id=?",
      [req.body.userId]
    );

    return res.status(200).json({ message: "success", data: data[0][0] });
  } catch (err) {
    return res.status(500);
  }
};
