const axios = require("axios");

// ============================================================
// Apollo.io API Key — 请在此处替换为你自己的 API Key
// ============================================================
const APOLLO_API_KEY = "mPzJjge8GVHlqpNcf0tO6w";

// Apollo API 基础地址
const APOLLO_BASE_URL = "https://api.apollo.io/api/v1";

// 通用请求头
const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache",
  "X-Api-Key": APOLLO_API_KEY,
};

// ============================================================
// 步骤1：公司信息补全
// 调用 GET /organizations/enrich，根据 domain 获取公司详情
// ============================================================
async function enrichCompany(domain) {
  try {
    const response = await axios.get(
      `${APOLLO_BASE_URL}/organizations/enrich`,
      {
        headers,
        params: { domain },
      }
    );

    const org = response.data.organization;

    if (!org) {
      return null;
    }

    // 只提取我们需要的字段
    return {
      name: org.name || "",
      industry: org.industry || "",
      employee_count: org.estimated_num_employees || "",
      website: org.website_url || "",
    };
  } catch (error) {
    console.error(
      "[enrichCompany] Apollo API 调用失败:",
      error.response?.data || error.message
    );
    throw new Error("公司信息补全失败");
  }
}

// ============================================================
// 步骤2：查找该公司的潜在联系人
// 调用 POST /mixed_people/search，按 domain + 职位过滤
// ============================================================
async function searchContacts(domain) {
  // 目标职位列表，可根据业务需求自行扩展
  const targetTitles = [
    "Operations Manager",
    "Procurement Manager",
    "Founder",
    "CEO",
  ];

  try {
    const response = await axios.post(
      `${APOLLO_BASE_URL}/mixed_people/search`,
      {
        organization_domains: [domain],
        person_titles: targetTitles,
        page: 1,
        per_page: 10,
      },
      { headers }
    );

    const people = response.data.people || [];

    if (people.length === 0) {
      return [];
    }

    // 返回精简后的联系人列表，供下一步 bulk_match 使用
    return people.map((p) => ({
      id: p.id || "",
      first_name: p.first_name || "",
      last_name: p.last_name || "",
      name: p.name || "",
      title: p.title || "",
      email: p.email || "",
      linkedin_url: p.linkedin_url || "",
    }));
  } catch (error) {
    console.error(
      "[searchContacts] Apollo API 调用失败:",
      error.response?.data || error.message
    );
    throw new Error("联系人搜索失败");
  }
}

// ============================================================
// 步骤3：补全联系人详细信息（邮箱、LinkedIn 等）
// 调用 POST /people/bulk_match，批量获取联系人完整资料
// ============================================================
async function bulkMatchContacts(people) {
  // 如果联系人列表为空，直接返回空数组
  if (!people || people.length === 0) {
    return [];
  }

  try {
    // 构造 bulk_match 请求体：通过姓名 + LinkedIn 进行匹配
    const details = people.map((p) => ({
      first_name: p.first_name,
      last_name: p.last_name,
      linkedin_url: p.linkedin_url,
    }));

    const response = await axios.post(
      `${APOLLO_BASE_URL}/people/bulk_match`,
      { details },
      { headers }
    );

    const matches = response.data.matches || [];

    // 整理返回结果，只保留业务需要的字段
    return matches.map((m) => ({
      name: m ? `${m.first_name || ""} ${m.last_name || ""}`.trim() : "",
      title: m?.title || "",
      email: m?.email || "",
      linkedin: m?.linkedin_url || "",
    }));
  } catch (error) {
    console.error(
      "[bulkMatchContacts] Apollo API 调用失败:",
      error.response?.data || error.message
    );
    throw new Error("联系人信息补全失败");
  }
}

// ============================================================
// 主流程：串联三个步骤，返回最终结果
// ============================================================
async function enrichCompanyAndContacts(domain) {
  // 步骤1：获取公司信息
  const company = await enrichCompany(domain);

  if (!company) {
    return {
      company: null,
      contacts: [],
      message: "未找到该公司信息",
    };
  }

  // 步骤2：搜索潜在联系人
  const rawContacts = await searchContacts(domain);

  if (rawContacts.length === 0) {
    return {
      company,
      contacts: [],
      message: "未找到符合条件的联系人",
    };
  }

  // 步骤3：补全联系人详细信息
  const contacts = await bulkMatchContacts(rawContacts);

  return {
    company,
    contacts,
  };
}

module.exports = {
  enrichCompanyAndContacts,
};
