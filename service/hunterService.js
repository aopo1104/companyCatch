const axios = require("axios");

// ============================================================
// Hunter.io API Key — 请在此处替换为你自己的 API Key
// ============================================================
const HUNTER_API_KEY = "4789495244c367344a68e0fa50470451b260f452";

// Hunter API 基础地址
const HUNTER_BASE_URL = "https://api.hunter.io/v2";

// ============================================================
// 域名邮箱搜索
// 调用 GET /domain-search，根据 domain 获取该公司所有公开邮箱
// ============================================================
async function domainSearch(domain) {
  try {
    const response = await axios.get(`${HUNTER_BASE_URL}/domain-search`, {
      params: {
        domain,
        api_key: HUNTER_API_KEY,
      },
    });

    const data = response.data.data;

    if (!data || !data.emails || data.emails.length === 0) {
      return {
        domain,
        emails: [],
        message: "未找到该域名的邮箱信息",
      };
    }

    // 整理返回结果，只保留业务需要的字段
    const emails = data.emails.map((e) => ({
      value: e.value || "",
      first_name: e.first_name || "",
      last_name: e.last_name || "",
      position: e.position || "",
      confidence: e.confidence || "",
    }));

    return {
      domain,
      emails,
    };
  } catch (error) {
    console.error(
      "[domainSearch] Hunter API 调用失败:",
      error.response?.data || error.message
    );
    throw new Error("Hunter 域名邮箱搜索失败");
  }
}

// ============================================================
// 邮箱查找
// 调用 GET /email-finder，支持多种查找方式：
//   1. domain + first_name + last_name
//   2. company + first_name + last_name
//   3. linkedin_url（无需姓名）
//   4. domain/company + full_name
// ============================================================
async function emailFinder(options = {}) {
  try {
    const params = { api_key: HUNTER_API_KEY };

    // 公司标识：domain / company / linkedin_url 至少提供一个
    if (options.domain) params.domain = options.domain;
    if (options.company) params.company = options.company;
    if (options.linkedin_url) params.linkedin_url = options.linkedin_url;

    // 姓名（使用 linkedin_url 时可省略）
    if (options.first_name) params.first_name = options.first_name;
    if (options.last_name) params.last_name = options.last_name;
    if (options.full_name) params.full_name = options.full_name;

    const response = await axios.get(`${HUNTER_BASE_URL}/email-finder`, {
      params,
    });

    const data = response.data.data;

    if (!data || !data.email) {
      return {
        domain: options.domain || "",
        company: options.company || "",
        linkedin_url: options.linkedin_url || "",
        first_name: options.first_name || "",
        last_name: options.last_name || "",
        email: null,
        message: "未找到该联系人的邮箱",
      };
    }

    // 返回查找到的邮箱及置信度
    return {
      domain: data.domain || options.domain || "",
      company: data.company || options.company || "",
      first_name: data.first_name || options.first_name || "",
      last_name: data.last_name || options.last_name || "",
      email: data.email || "",
      confidence: data.confidence || 0,
      score: data.score || 0,
      position: data.position || "",
      linkedin_url: data.linkedin || options.linkedin_url || "",
      verification: data.verification || null,
    };
  } catch (error) {
    console.error(
      "[emailFinder] Hunter API 调用失败:",
      error.response?.data || error.message
    );
    throw new Error("Hunter 邮箱查找失败");
  }
}

// ============================================================
// 邮箱验证
// 调用 GET /email-verifier，验证邮箱是否有效
// ============================================================
async function emailVerifier(email) {
  try {
    const response = await axios.get(`${HUNTER_BASE_URL}/email-verifier`, {
      params: {
        email,
        api_key: HUNTER_API_KEY,
      },
    });

    const data = response.data.data;

    if (!data) {
      return {
        email,
        result: null,
        message: "验证失败，未获取到结果",
      };
    }

    // 返回验证结果
    // status: valid / invalid / accept_all / webmail / disposable / unknown
    return {
      email: data.email || email,
      status: data.status || "unknown",
      result: data.result || "unknown",
      score: data.score || 0,
      regexp: data.regexp ?? null,
      gibberish: data.gibberish ?? null,
      disposable: data.disposable ?? null,
      webmail: data.webmail ?? null,
      mx_records: data.mx_records ?? null,
      smtp_server: data.smtp_server ?? null,
      smtp_check: data.smtp_check ?? null,
      accept_all: data.accept_all ?? null,
      block: data.block ?? null,
    };
  } catch (error) {
    console.error(
      "[emailVerifier] Hunter API 调用失败:",
      error.response?.data || error.message
    );
    throw new Error("Hunter 邮箱验证失败");
  }
}

// ============================================================
// 公司发现
// 调用 POST /discover，按条件搜索公司（免费接口）
// 支持自然语言 query 或结构化筛选条件
// ============================================================
async function discover(options = {}) {
  try {
    const body = {};

    // 自然语言查询
    if (options.query) {
      body.query = options.query;
    }

    // 结构化筛选
    if (options.industries) {
      body.industries = { include: options.industries };
    }
    if (options.employee_ranges) {
      body.employees = { include: options.employee_ranges };
    }
    if (options.headquarters_location) {
      body.headquarters_location = options.headquarters_location;
    }
    if (options.technologies) {
      body.technologies = { include: options.technologies };
    }

    // 注意：免费套餐不支持 limit/offset 参数，会返回 pagination_error
    // 付费套餐可以取消下面的注释来启用分页
    // if (options.limit) body.limit = options.limit;
    // if (options.offset) body.offset = options.offset;

    console.log("[discover] 请求体:", JSON.stringify(body, null, 2));

    const response = await axios.post(
      `${HUNTER_BASE_URL}/discover?api_key=${HUNTER_API_KEY}`,
      body,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("[discover] 原始响应:", JSON.stringify(response.data, null, 2));

    // discover 接口返回的 data 直接就是公司数组，不是 data.domains
    const companies = response.data.data;
    const meta = response.data.meta;
    
    console.log("[discover] 公司数组长度:", companies?.length);

    if (!companies || companies.length === 0) {
      console.log("[discover] 判断为空，返回空列表");
      return {
        companies: [],
        total: 0,
        message: "未找到符合条件的公司",
      };
    }

    console.log("[discover] 找到公司数量:", companies.length);

    // 提取套餐限制提示
    const planLimit = meta?.details || "";
    const limitMessage = planLimit.includes("limited to") 
      ? `提示：${planLimit}` 
      : "";

    return {
      companies: companies.map((c) => ({
        domain: c.domain || "",
        name: c.organization || "",  // 字段名是 organization 不是 company_name
        industry: c.industry || "",
        employees: c.employees_count?.total || c.emails_count?.total || "",
        location: c.location || "",
        logo: c.logo || "",
      })),
      total: meta?.results || companies.length,
      message: limitMessage || undefined,
      filters: meta?.filters || null,
    };
  } catch (error) {
    console.error(
      "[discover] Hunter API 调用失败:",
      error.response?.data || error.message
    );
    throw new Error("Hunter 公司发现搜索失败");
  }
}

// ============================================================
// 邮箱数量查询
// 调用 GET /email-count，查询某域名有多少公开邮箱（免费接口）
// ============================================================
async function emailCount(domain) {
  try {
    const response = await axios.get(`${HUNTER_BASE_URL}/email-count`, {
      params: {
        domain,
        api_key: HUNTER_API_KEY,
      },
    });

    const data = response.data.data;

    if (!data) {
      return {
        domain,
        total: 0,
        message: "未获取到邮箱数量信息",
      };
    }

    return {
      domain,
      total: data.total || 0,
      personal_emails: data.personal_emails || 0,
      generic_emails: data.generic_emails || 0,
      // 按部门分布
      department: data.department || {},
      // 按职级分布
      seniority: data.seniority || {},
    };
  } catch (error) {
    console.error(
      "[emailCount] Hunter API 调用失败:",
      error.response?.data || error.message
    );
    throw new Error("Hunter 邮箱数量查询失败");
  }
}

// ============================================================
// 人员信息补全（Email Enrichment）
// 调用 GET /people/find，通过邮箱或 LinkedIn 获取人员详细信息
// ============================================================
async function emailEnrichment(email, linkedin) {
  try {
    const params = { api_key: HUNTER_API_KEY };
    if (email) params.email = email;
    if (linkedin) params.linkedin = linkedin;

    const response = await axios.get(`${HUNTER_BASE_URL}/people/find`, {
      params,
    });

    const data = response.data.data;

    if (!data) {
      return {
        email,
        person: null,
        message: "未找到该人员的信息",
      };
    }

    return {
      person: {
        full_name: data.name?.fullName || "",
        first_name: data.name?.givenName || "",
        last_name: data.name?.familyName || "",
        email: data.email || "",
        location: data.location || "",
        bio: data.bio || "",
        avatar: data.avatar || "",
        phone: data.phone || "",
        employment: {
          company: data.employment?.name || "",
          domain: data.employment?.domain || "",
          title: data.employment?.title || "",
          role: data.employment?.role || "",
          seniority: data.employment?.seniority || "",
        },
        social: {
          linkedin: data.linkedin?.handle
            ? `https://linkedin.com/in/${data.linkedin.handle}`
            : "",
          twitter: data.twitter?.handle
            ? `https://twitter.com/${data.twitter.handle}`
            : "",
          facebook: data.facebook?.handle || "",
          github: data.github?.handle
            ? `https://github.com/${data.github.handle}`
            : "",
        },
      },
    };
  } catch (error) {
    // 404 表示未找到
    if (error.response?.status === 404) {
      return {
        email,
        person: null,
        message: "未找到该人员的信息",
      };
    }
    console.error(
      "[emailEnrichment] Hunter API 调用失败:",
      error.response?.data || error.message
    );
    throw new Error("Hunter 人员信息补全失败");
  }
}

// ============================================================
// 公司信息补全（Company Enrichment）
// 调用 GET /companies/find，通过域名获取公司详细信息
// ============================================================
async function companyEnrichment(domain) {
  try {
    const response = await axios.get(`${HUNTER_BASE_URL}/companies/find`, {
      params: {
        domain,
        api_key: HUNTER_API_KEY,
      },
    });

    const data = response.data.data;

    if (!data) {
      return {
        domain,
        company: null,
        message: "未找到该公司的信息",
      };
    }

    return {
      company: {
        name: data.name || "",
        legal_name: data.legalName || "",
        domain: data.domain || "",
        description: data.description || "",
        founded_year: data.foundedYear || "",
        location: data.location || "",
        logo: data.logo || "",
        phone: data.phone || "",
        type: data.company_type || data.type || "",
        industry: data.category?.industry || "",
        sector: data.category?.sector || "",
        employees: data.metrics?.employees || "",
        traffic_rank: data.metrics?.trafficRank || "",
        annual_revenue: data.metrics?.annualRevenue || "",
        tech: data.tech || [],
        tech_categories: data.techCategories || [],
        social: {
          linkedin: data.linkedin?.handle
            ? `https://linkedin.com/${data.linkedin.handle}`
            : "",
          twitter: data.twitter?.handle
            ? `https://twitter.com/${data.twitter.handle}`
            : "",
          facebook: data.facebook?.handle
            ? `https://facebook.com/${data.facebook.handle}`
            : "",
          instagram: data.instagram?.handle
            ? `https://instagram.com/${data.instagram.handle}`
            : "",
          crunchbase: data.crunchbase?.handle
            ? `https://crunchbase.com/${data.crunchbase.handle}`
            : "",
        },
        geo: data.geo || {},
        tags: data.tags || [],
        funding_rounds: data.fundingRounds || [],
      },
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        domain,
        company: null,
        message: "未找到该公司的信息",
      };
    }
    console.error(
      "[companyEnrichment] Hunter API 调用失败:",
      error.response?.data || error.message
    );
    throw new Error("Hunter 公司信息补全失败");
  }
}

// ============================================================
// 联合补全（Combined Enrichment）
// 调用 GET /combined/find，通过邮箱同时获取人员和公司信息
// ============================================================
async function combinedEnrichment(email) {
  try {
    const response = await axios.get(`${HUNTER_BASE_URL}/combined/find`, {
      params: {
        email,
        api_key: HUNTER_API_KEY,
      },
    });

    const data = response.data.data;

    if (!data) {
      return {
        email,
        person: null,
        company: null,
        message: "未找到相关信息",
      };
    }

    const p = data.person;
    const c = data.company;

    return {
      person: p
        ? {
            full_name: p.name?.fullName || "",
            email: p.email || "",
            location: p.location || "",
            title: p.employment?.title || "",
            seniority: p.employment?.seniority || "",
            linkedin: p.linkedin?.handle
              ? `https://linkedin.com/in/${p.linkedin.handle}`
              : "",
            twitter: p.twitter?.handle
              ? `https://twitter.com/${p.twitter.handle}`
              : "",
          }
        : null,
      company: c
        ? {
            name: c.name || "",
            domain: c.domain || "",
            industry: c.category?.industry || "",
            description: c.description || "",
            employees: c.metrics?.employees || "",
            location: c.location || "",
            logo: c.logo || "",
            linkedin: c.linkedin?.handle
              ? `https://linkedin.com/${c.linkedin.handle}`
              : "",
          }
        : null,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        email,
        person: null,
        company: null,
        message: "未找到相关信息",
      };
    }
    console.error(
      "[combinedEnrichment] Hunter API 调用失败:",
      error.response?.data || error.message
    );
    throw new Error("Hunter 联合补全失败");
  }
}

// ============================================================
// 账户信息
// 调用 GET /account，查看当前账户的额度和使用情况（免费接口）
// ============================================================
async function accountInfo() {
  try {
    const response = await axios.get(`${HUNTER_BASE_URL}/account`, {
      params: { api_key: HUNTER_API_KEY },
    });

    const data = response.data.data;

    if (!data) {
      return { account: null, message: "无法获取账户信息" };
    }

    return {
      account: {
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        plan_name: data.plan_name || "",
        reset_date: data.reset_date || "",
        requests: {
          searches_used: data.requests?.searches?.used ?? 0,
          searches_available: data.requests?.searches?.available ?? 0,
          verifications_used: data.requests?.verifications?.used ?? 0,
          verifications_available:
            data.requests?.verifications?.available ?? 0,
        },
      },
    };
  } catch (error) {
    console.error(
      "[accountInfo] Hunter API 调用失败:",
      error.response?.data || error.message
    );
    throw new Error("Hunter 账户信息获取失败");
  }
}

module.exports = {
  domainSearch,
  emailFinder,
  emailVerifier,
  discover,
  emailCount,
  emailEnrichment,
  companyEnrichment,
  combinedEnrichment,
  accountInfo,
};
