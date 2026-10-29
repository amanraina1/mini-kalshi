import express from "express";
import { verifyAdmin, veriyAuth } from "./middlewares/auth.middleware";
import authRoutes from "./routes/auth.route";
import marketRoutes from "./routes/market.route";
import betRoutes from "./routes/bet.route";
import extraRoutes from "./routes/extra.route";
import resolveRoutes from "./routes/resolve.route";

const app = express();
app.use(express.json({}));

const PORT = process.env.PORT || 3001;

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/market", veriyAuth, marketRoutes);
app.use("/api/v1/bet", veriyAuth, betRoutes);
app.use("/api/v1/", veriyAuth, extraRoutes);
app.use("/api/v1/resolve", verifyAdmin, resolveRoutes);

app.listen(PORT, () => {
  console.log(`Server is listening at PORT: ${PORT}`)
})