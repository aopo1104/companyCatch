const express = require("express");
const router = express.Router();
const {
  domainSearch,
  emailFinder,
  emailVerifier,
  discover,
  emailCount,
  emailEnrichment,
  companyEnrichment,
  combinedEnrichment,
  accountInfo,
} = require("../service/hunterService");

// ============================================================
// POST /hunter-domain-search
// 请求体: { "domain": "example.com" }
// 根据域名查找该公司的公开邮箱列表
// ============================================================
router.post("/hunter-domain-search", async (req, res) => {
  try {
    const { domain } = req.body;

    // 参数校验：domain 为必填
    if (!domain) {
      return res.status(400).json({
        error: "请提供 domain 参数",
      });
    }

    console.log(`[hunter-domain-search] 开始查询，目标 domain: ${domain}`);

    // 调用 Hunter 服务
    const result = await domainSearch(domain);

    return res.json(result);
  } catch (error) {
    console.error("[hunter-domain-search] 处理失败:", error.message);
    return res.status(500).json({
      error: "服务内部错误",
      detail: error.message,
    });
  }
});

// ============================================================
// POST /hunter-email-finder
// 支持多种查找方式：
//   { "domain": "google.com", "first_name": "John", "last_name": "Doe" }
//   { "company": "Google", "first_name": "John", "last_name": "Doe" }
//   { "linkedin_url": "https://linkedin.com/in/johndoe" }  （无需姓名）
//   { "domain": "google.com", "full_name": "John Doe" }
// ============================================================
router.post("/hunter-email-finder", async (req, res) => {
  try {
    const { domain, company, linkedin_url, first_name, last_name, full_name } = req.body;

    // 参数校验：domain / company / linkedin_url 至少提供一个
    if (!domain && !company && !linkedin_url) {
      return res.status(400).json({
        error: "请至少提供 domain、company 或 linkedin_url 中的一个",
      });
    }

    // 如果没有 linkedin_url，则需要姓名
    if (!linkedin_url && !first_name && !last_name && !full_name) {
      return res.status(400).json({
        error: "非 LinkedIn 查找时，请提供 first_name + last_name 或 full_name",
      });
    }

    console.log(`[hunter-email-finder] 查找: domain=${domain || "-"}, company=${company || "-"}, linkedin=${linkedin_url || "-"}, name=${first_name || ""} ${last_name || ""} ${full_name || ""}`);

    const result = await emailFinder({ domain, company, linkedin_url, first_name, last_name, full_name });

    return res.json(result);
  } catch (error) {
    console.error("[hunter-email-finder] 处理失败:", error.message);
    return res.status(500).json({
      error: "服务内部错误",
      detail: error.message,
    });
  }
});

// ============================================================
// POST /hunter-email-verifier
// 请求体: { "email": "john@example.com" }
// 验证邮箱是否有效
// ============================================================
router.post("/hunter-email-verifier", async (req, res) => {
  try {
    const { email } = req.body;

    // 参数校验
    if (!email) {
      return res.status(400).json({
        error: "请提供 email 参数",
      });
    }

    console.log(`[hunter-email-verifier] 验证邮箱: ${email}`);

    const result = await emailVerifier(email);

    return res.json(result);
  } catch (error) {
    console.error("[hunter-email-verifier] 处理失败:", error.message);
    return res.status(500).json({
      error: "服务内部错误",
      detail: error.message,
    });
  }
});

// ============================================================
// POST /hunter-discover
// 请求体: { "query": "SaaS companies in France" }
// 或结构化: { "industries": ["saas"], "headquarters_location": {...}, ... }
// 按条件搜索公司（免费接口）
// ============================================================
router.post("/hunter-discover", async (req, res) => {
  try {
    const { query, industries, employee_ranges, headquarters_location, technologies, limit, offset } = req.body;

    if (!query && !industries && !headquarters_location && !technologies && !employee_ranges) {
      return res.status(400).json({
        error: "请提供 query（自然语言）或至少一个筛选条件（industries / employee_ranges / headquarters_location / technologies）",
      });
    }

    console.log(`[hunter-discover] 搜索公司，query: ${query || "(结构化筛选)"}`);

    const result = await discover({ query, industries, employee_ranges, headquarters_location, technologies, limit, offset });

    return res.json(result);
  } catch (error) {
    console.error("[hunter-discover] 处理失败:", error.message);
    return res.status(500).json({
      error: "服务内部错误",
      detail: error.message,
    });
  }
});

// ============================================================
// POST /hunter-email-count
// 请求体: { "domain": "example.com" }
// 查询某域名有多少公开邮箱（免费接口）
// ============================================================
router.post("/hunter-email-count", async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: "请提供 domain 参数" });
    }

    console.log(`[hunter-email-count] 查询域名: ${domain}`);

    const result = await emailCount(domain);

    return res.json(result);
  } catch (error) {
    console.error("[hunter-email-count] 处理失败:", error.message);
    return res.status(500).json({
      error: "服务内部错误",
      detail: error.message,
    });
  }
});

// ============================================================
// POST /hunter-email-enrichment
// 请求体: { "email": "matt@hunter.io" } 或 { "linkedin": "matttharp" }
// 通过邮箱或 LinkedIn 获取人员详细信息
// ============================================================
router.post("/hunter-email-enrichment", async (req, res) => {
  try {
    const { email, linkedin } = req.body;

    if (!email && !linkedin) {
      return res.status(400).json({
        error: "请提供 email 或 linkedin 参数",
      });
    }

    console.log(`[hunter-email-enrichment] 查询: ${email || linkedin}`);

    const result = await emailEnrichment(email, linkedin);

    return res.json(result);
  } catch (error) {
    console.error("[hunter-email-enrichment] 处理失败:", error.message);
    return res.status(500).json({
      error: "服务内部错误",
      detail: error.message,
    });
  }
});

// ============================================================
// POST /hunter-company-enrichment
// 请求体: { "domain": "hunter.io" }
// 通过域名获取公司详细信息
// ============================================================
router.post("/hunter-company-enrichment", async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: "请提供 domain 参数" });
    }

    console.log(`[hunter-company-enrichment] 查询公司: ${domain}`);

    const result = await companyEnrichment(domain);

    return res.json(result);
  } catch (error) {
    console.error("[hunter-company-enrichment] 处理失败:", error.message);
    return res.status(500).json({
      error: "服务内部错误",
      detail: error.message,
    });
  }
});

// ============================================================
// POST /hunter-combined-enrichment
// 请求体: { "email": "matt@hunter.io" }
// 通过邮箱同时获取人员和公司信息
// ============================================================
router.post("/hunter-combined-enrichment", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "请提供 email 参数" });
    }

    console.log(`[hunter-combined-enrichment] 联合查询: ${email}`);

    const result = await combinedEnrichment(email);

    return res.json(result);
  } catch (error) {
    console.error("[hunter-combined-enrichment] 处理失败:", error.message);
    return res.status(500).json({
      error: "服务内部错误",
      detail: error.message,
    });
  }
});

// ============================================================
// GET /hunter-account
// 查看当前 Hunter 账户的额度和使用情况（免费接口）
// ============================================================
router.get("/hunter-account", async (_req, res) => {
  try {
    console.log("[hunter-account] 查询账户信息");

    const result = await accountInfo();

    return res.json(result);
  } catch (error) {
    console.error("[hunter-account] 处理失败:", error.message);
    return res.status(500).json({
      error: "服务内部错误",
      detail: error.message,
    });
  }
});

module.exports = router;
