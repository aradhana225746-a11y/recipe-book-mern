const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });
// Load real test credentials from this git-ignored file, keeping the committed .env safe.
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), override: true });

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});
app.use("/api/recipes", require("./routes/recipes"));
app.use("/api/shopping-list", require("./routes/shopping-list"));
app.use("/api", (_req, res) => res.status(404).json({ message: "API endpoint not found." }));

app.use((error, _req, res, _next) => {
  if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(error.errors)[0].message });
  }
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON request." });
  }
  console.error(error);
  return res.status(500).json({ message: "Something went wrong on the server." });
});

async function startServer() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("example.mongodb.net") || uri.includes("replace-with-test-password") || uri.includes("YOUR_PASSWORD") || uri.includes("<db_password>")) {
    console.error("Set MONGODB_URI in backend/.env.local to your MongoDB Atlas TEST database URI.");
    process.exitCode = 1;
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const port = Number(process.env.PORT) || 5000;
    app.listen(port, () => console.log("Recipe Book API running at http://localhost:" + port));
  } catch (error) {
    console.error("MongoDB Atlas connection failed:", error.message);
    process.exitCode = 1;
  }
}

startServer();
