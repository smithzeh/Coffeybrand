// server.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Middleware
const { authenticateToken, authorizeRoles } = require("./middleware/auth");

// Models
const { User, Business } = require("./models/User");
const Partnership = require("./models/Partnership");
const Withdrawal = require("./models/Withdrawal");

// Routes
const advertRoutes = require("./routes/advertRoutes");
const walletRoutes = require("./routes/wallet");
const partnershipRoutes = require("./routes/partnershipRoutes");
const statementRoutes = require("./routes/statementRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contributionRoutes = require("./routes/contributionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ---------------------- MIDDLEWARE ----------------------
app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.set("io", io);

// ---------------------- MONGODB ----------------------
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/coffeybrand")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error(err));

// ---------------------- SOCKET.IO ----------------------
const onlineUsers = {}; // { userId: socketId }

io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log(`🔗 User ${userId} registered with socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        console.log(`❌ User ${userId} disconnected`);
        break;
      }
    }
  });
});

// ---------------------- ROUTES ----------------------
// Example: Withdrawal approval emitting socket event to specific user
app.put(
  "/withdrawals/:id",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;
      if (!["approved", "rejected"].includes(status))
        return res.status(400).json({ message: "Invalid status" });

      const withdrawal = await Withdrawal.findById(req.params.id);
      if (!withdrawal)
        return res.status(404).json({ message: "Withdrawal not found" });

      withdrawal.status = status;
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      // Emit event only to the partner
      const socketId = onlineUsers[withdrawal.partnerId];
      if (socketId) {
        io.to(socketId).emit("withdrawalUpdate", { withdrawal });
      }

      res.json({ message: `Withdrawal ${status}`, withdrawal });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ---------------------- EXTRA ROUTES ----------------------
app.use("/api/adverts", advertRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/partnerships", partnershipRoutes);
app.use("/api/statements", statementRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/notifications", notificationRoutes);

// ---------------------- START SERVER ----------------------
const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

module.exports = { app, server, io, onlineUsers };
