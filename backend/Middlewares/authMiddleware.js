import jwt from "jsonwebtoken";
const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.authToken;

    jwt.verify(token, process.env.JWT_SECREAT_KEY, (error, decode) => {
      if (error)
        return res
          .status(401)
          .json({ message: "un Authorized user", data: null });

      req.body.userId = decode.id;
      req.headers["userId"] = decode.id;

      next();
    });
  } catch (error) {}
};
export default authMiddleware;
