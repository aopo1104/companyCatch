const express = require("express");
const path = require("path");
const enrichRoutes = require("./routes/enrich");
const hunterRoutes = require("./routes/hunter");

const app = express();
const PORT = process.env.PORT || 3000;

// 解析 JSON 请求体
app.use(express.json());

// 托管前端静态文件
app.use(express.static(path.join(__dirname, "public")));

// 默认首页
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "app.html"));
});

// 注册路由 — Apollo
app.use("/", enrichRoutes);

// 注册路由 — Hunter
app.use("/", hunterRoutes);

// 健康检查接口
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`Demo 服务已启动: http://localhost:${PORT}`);
  console.log(`POST http://localhost:${PORT}/enrich-company   (Apollo)`);
  console.log(`POST http://localhost:${PORT}/hunter-domain-search (Hunter)`);
});
