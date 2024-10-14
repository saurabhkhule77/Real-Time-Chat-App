import sql from "mysql2/promise.js";

const connection = await sql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "quick_chat",
});

try {
  console.log("Database connected");
} catch (err) {
  console.log(err);
}

export default connection;
