import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties.js";
import evaluationRoutes from "./routes/evaluations.js";
import clientRoutes from "./routes/clients.js";
import gmailRoutes from "./routes/gmail.js";
import inboxRoutes from "./routes/inbox.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/gmail", gmailRoutes);
app.use("/api/inbox", inboxRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
});
