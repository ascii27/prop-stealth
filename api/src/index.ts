import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
});
