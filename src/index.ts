import express from "express";
import { verifyAdmin, veriyAuth } from "./middlewares/auth.middleware";
import authRoutes from "./routes/auth.route";
import marketRoutes from "./routes/market.route";
import resolveRoutes from "./routes/resolve.route";
import walletRoutes from "./routes/wallet.route";
import orderRoutes from "./routes/order.route"

const app = express();
app.use(express.json({}));

const PORT = process.env.PORT || 3000;

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/market", veriyAuth, marketRoutes);
// Pending
app.use("/api/v1/wallet", veriyAuth, walletRoutes);
app.use("/api/v1/order", veriyAuth, orderRoutes)

app.use("/api/v1/resolve", verifyAdmin, resolveRoutes);

app.listen(PORT, () => {
  console.log(`Server is listening at PORT: ${PORT}`)
})