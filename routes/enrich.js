const express = require("express");
const router = express.Router();
const { enrichCompanyAndContacts } = require("../service/apolloService");

// ============================================================
// POST /enrich-company
// 请求体: { "company_name": "xxx", "domain": "xxx.com" }
// 如果 domain 存在则优先使用 domain；否则使用 company_name 作为 domain 猜测
// ============================================================
router.post("/enrich-company", async (req, res) => {
  try {
    const { company_name, domain } = req.body;

    // 参数校验：至少需要提供 company_name 或 domain
    if (!company_name && !domain) {
      return res.status(400).json({
        error: "请至少提供 company_name 或 domain 参数",
      });
    }

    // 优先使用 domain；若未提供，则尝试用 company_name 作为 domain
    const targetDomain = domain || company_name;

    console.log(`[enrich-company] 开始处理，目标 domain: ${targetDomain}`);

    // 调用 Apollo 服务完成三步补全
    const result = await enrichCompanyAndContacts(targetDomain);

    return res.json(result);
  } catch (error) {
    console.error("[enrich-company] 处理失败:", error.message);
    return res.status(500).json({
      error: "服务内部错误",
      detail: error.message,
    });
  }
});

module.exports = router;
