# Day 13：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. JWT 结构

**JWT（JSON Web Token）是一种无状态认证机制：**

```
JWT = Header.Payload.Signature

Header: {"alg": "HS256", "typ": "JWT"}
Payload: {"sub": "1234567890", "name": "John Doe", "exp": 1699999999}
Signature: HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

**Header（头部）：**

```json
{
  "alg": "HS256",  // 签名算法
  "typ": "JWT"     // 令牌类型
}
```

**Payload（负载）：**

| 字段 | 说明 | 示例 |
|-----|------|------|
| `iss` | 签发者 | `example.com` |
| `sub` | 主题（用户 ID） | `123456` |
| `aud` | 受众 | `app.example.com` |
| `exp` | 过期时间（时间戳） | `1699999999` |
| `iat` | 签发时间 | `1600000000` |
| `nbf` | 生效时间 | `1600000000` |
| `jti` | JWT ID | `unique-token-id` |

**签名（Signature）：**

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

#### 2. 认证流程

**JWT 认证的完整流程：**

```
1. 用户登录 → 服务端验证用户名密码 → 生成 JWT → 返回给客户端
2. 客户端存储 JWT（localStorage/cookie）
3. 后续请求在 Header 中携带 JWT: Authorization: Bearer xxx
4. 服务端验证 JWT → 解析用户信息 → 处理请求
```

**Token 存储方式对比：**

| 方式 | 优点 | 缺点 |
|-----|------|------|
| **localStorage** | 容量大（5MB） | 容易被 XSS 攻击 |
| **sessionStorage** | 会话级别，安全 | 页面刷新后丢失 |
| **Cookie（HttpOnly）** | 防止 XSS | 容易被 CSRF 攻击 |
| **Cookie（Secure）** | 仅 HTTPS 传输 | 需要配置 HTTPS |

**安全建议：**

| 建议 | 说明 |
|-----|------|
| 使用 HTTPS | 防止 Token 被劫持 |
| 设置合理过期时间 | 缩短攻击窗口 |
| 使用 HttpOnly Cookie | 防止 XSS |
| 实施 CSRF 防护 | 使用 Token/Referer 验证 |
| 定期更换密钥 | 防止密钥泄露 |

#### 3. BCrypt 密码加密

**BCrypt 是一种安全的密码哈希算法：**

```java
// 密码加密
PasswordEncoder encoder = new BCryptPasswordEncoder();
String rawPassword = "123456";
String encodedPassword = encoder.encode(rawPassword);

// 密码验证
boolean matches = encoder.matches(rawPassword, encodedPassword);

// BCrypt 特点：
// 1. 自动加盐（每个密码的盐不同）
// 2. 可配置计算强度（默认 10）
// 3. 单向哈希（无法逆向解密）
```

**密码存储最佳实践：**

| 原则 | 说明 |
|-----|------|
| 永远不存储明文密码 | 使用哈希算法加密 |
| 使用强哈希算法 | BCrypt > SHA-256 |
| 每个密码使用不同的盐 | 防止彩虹表攻击 |
| 设置合理的哈希强度 | 平衡安全性和性能 |
| 定期更换哈希算法 | 跟随安全标准演进 |

**密码策略：**

```java
// 密码强度校验
public boolean isValidPassword(String password) {
    // 至少 8 位，包含大小写字母和数字
    String pattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$";
    return password.matches(pattern);
}

// 密码过期策略
public boolean isPasswordExpired(User user) {
    LocalDateTime expiryDate = user.getPasswordUpdatedAt().plusDays(90);
    return LocalDateTime.now().isAfter(expiryDate);
}
```

#### 4. OAuth 2.0

**OAuth 2.0 授权流程：**

```
Authorization Code 流程（最常用）：

1. 用户访问第三方应用
2. 重定向到授权服务器（带 client_id、redirect_uri、scope）
3. 用户登录并授权
4. 授权服务器返回授权码（code）
5. 第三方应用用授权码换取访问令牌（access_token）
6. 使用访问令牌访问资源服务器
```

**OAuth 2.0 角色：**

| 角色 | 说明 |
|-----|------|
| **Resource Owner** | 资源所有者（用户） |
| **Client** | 第三方应用 |
| **Authorization Server** | 授权服务器 |
| **Resource Server** | 资源服务器 |

**OAuth 2.0 授权类型：**

| 类型 | 说明 | 适用场景 |
|-----|------|---------|
| **Authorization Code** | 授权码模式 | Web 应用 |
| **Implicit** | 隐式模式 | SPA 应用 |
| **Password** | 密码模式 | 信任的内部应用 |
| **Client Credentials** | 客户端凭证模式 | 服务间调用 |
| **Refresh Token** | 刷新令牌 | 获取新的 access_token |

**JWT vs Session：**

| 特性 | JWT | Session |
|-----|-----|--------|
| 状态 | 无状态 | 有状态 |
| 存储 | 客户端 | 服务端 |
| 扩展性 | 好（易于水平扩展） | 差（需要共享 Session） |
| 安全性 | 依赖签名和 HTTPS | 依赖 Cookie 安全 |
| 过期处理 | Token 过期需重新登录 | Session 可自动续期 |