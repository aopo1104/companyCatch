# Apollo.io Enrich Demo

通过 Apollo.io API 自动补全公司和联系人信息的 Demo 服务。

## 项目结构

```
apollo/
├── app.js                      # Express 入口
├── routes/
│   └── enrich.js               # 路由定义
├── service/
│   └── apolloService.js        # Apollo API 调用逻辑
├── package.json
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key

打开 `service/apolloService.js`，将第 6 行的 `YOUR_APOLLO_API_KEY` 替换为你的 Apollo.io API Key：

```js
const APOLLO_API_KEY = "YOUR_APOLLO_API_KEY";
```

### 3. 启动服务

```bash
npm start
```

服务默认运行在 `http://localhost:3000`。

## API 说明

### POST /enrich-company

根据公司域名（优先）或公司名称，自动补全公司信息和潜在联系人。

**请求体：**

```json
{
  "company_name": "Apollo.io",
  "domain": "apollo.io"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| company_name | string | 否* | 公司名称 |
| domain | string | 否* | 公司域名（优先使用） |

> *至少提供其中一个参数。

**响应示例：**

```json
{
  "company": {
    "name": "Apollo.io",
    "industry": "information technology & services",
    "employee_count": 500,
    "website": "http://www.apollo.io"
  },
  "contacts": [
    {
      "name": "John Doe",
      "title": "CEO",
      "email": "john@apollo.io",
      "linkedin": "https://www.linkedin.com/in/johndoe"
    }
  ]
}
```

## 测试

### 使用 curl（同时提供 domain 和 company_name）

```bash
curl -X POST http://localhost:3000/enrich-company \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Apollo.io", "domain": "apollo.io"}'
```

### 仅提供 domain

```bash
curl -X POST http://localhost:3000/enrich-company \
  -H "Content-Type: application/json" \
  -d '{"domain": "google.com"}'
```

### 仅提供 company_name（将作为 domain 尝试查询）

```bash
curl -X POST http://localhost:3000/enrich-company \
  -H "Content-Type: application/json" \
  -d '{"company_name": "stripe.com"}'
```

### Windows PowerShell

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/enrich-company" `
  -ContentType "application/json" `
  -Body '{"company_name": "Apollo.io", "domain": "apollo.io"}'
```

### 健康检查

```bash
curl http://localhost:3000/health
```
