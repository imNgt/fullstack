# Day 18：综合实战 - 业务逻辑 + 高级查询

### 📚 业务场景（30 分钟）

#### 1. 复杂业务需求

| 场景 | 描述 | 技术要点 |
|-----|------|---------|
| 用户统计 | 按条件统计用户数量 | JPA Criteria API |
| 导出功能 | 导出用户数据到 Excel | Apache POI |
| 数据校验 | 复杂业务规则校验 | @Valid + 自定义校验器 |
| 批量操作 | 批量创建/更新/删除 | 事务批处理 |

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：复杂查询

```java
@Service
public class UserServiceImpl {
    
    @Autowired
    private UserRepository userRepository;
    
    // 条件查询
    @Transactional(readOnly = true)
    public List<UserResponse> queryUsers(UserQueryRequest request) {
        Specification<User> spec = buildSpecification(request);
        return userRepository.findAll(spec)
            .stream()
            .map(UserResponse::fromEntity)
            .collect(Collectors.toList());
    }
    
    private Specification<User> buildSpecification(UserQueryRequest request) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // 姓名模糊查询
            if (StringUtils.hasText(request.getName())) {
                predicates.add(cb.like(root.get("name"), "%" + request.getName() + "%"));
            }
            
            // 邮箱精确查询
            if (StringUtils.hasText(request.getEmail())) {
                predicates.add(cb.equal(root.get("email"), request.getEmail()));
            }
            
            // 年龄范围
            if (request.getMinAge() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("age"), request.getMinAge()));
            }
            if (request.getMaxAge() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("age"), request.getMaxAge()));
            }
            
            // 创建时间范围
            if (request.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), request.getStartDate()));
            }
            if (request.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), request.getEndDate()));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    // 统计
    @Transactional(readOnly = true)
    public Map<String, Long> getUserStatistics() {
        Map<String, Long> statistics = new HashMap<>();
        
        // 总用户数
        statistics.put("total", userRepository.count());
        
        // 活跃用户数（最近30天注册）
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        statistics.put("active30Days", userRepository.countByCreatedAtAfter(thirtyDaysAgo));
        
        // 按角色统计
        List<Object[]> roleStats = userRepository.countByRole();
        for (Object[] row : roleStats) {
            String roleName = (String) row[0];
            Long count = (Long) row[1];
            statistics.put("role_" + roleName, count);
        }
        
        return statistics;
    }
}

// Repository 方法
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    
    long countByCreatedAtAfter(LocalDateTime dateTime);
    
    @Query("SELECT r.name, COUNT(u) FROM User u JOIN u.roles r GROUP BY r.name")
    List<Object[]> countByRole();
}
```

#### 任务 2：Excel 导出

```java
@Service
public class ExportService {
    
    @Autowired
    private UserRepository userRepository;
    
    public byte[] exportUsers(UserQueryRequest request) throws IOException {
        List<User> users = userRepository.findAll(buildSpecification(request));
        
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("用户列表");
            
            // 创建表头
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "姓名", "邮箱", "年龄", "创建时间"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }
            
            // 填充数据
            int rowNum = 1;
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            for (User user : users) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(user.getId());
                row.createCell(1).setCellValue(user.getName());
                row.createCell(2).setCellValue(user.getEmail());
                row.createCell(3).setCellValue(user.getAge() != null ? user.getAge() : 0);
                row.createCell(4).setCellValue(user.getCreatedAt() != null ? 
                    user.getCreatedAt().format(formatter) : "");
            }
            
            // 自动调整列宽
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            // 写入字节数组
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }
}

// Controller
@GetMapping("/export")
public ResponseEntity<byte[]> exportUsers(UserQueryRequest request) throws IOException {
    byte[] data = exportService.exportUsers(request);
    
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
    headers.setContentDispositionFormData("attachment", "users.xlsx");
    
    return new ResponseEntity<>(data, headers, HttpStatus.OK);
}
```

#### 任务 3：自定义校验器

```java
// 自定义校验注解
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = EmailDomainValidator.class)
public @interface ValidEmailDomain {
    String message() default "邮箱域名不允许";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    String[] allowedDomains() default {};
}

// 校验器实现
public class EmailDomainValidator implements ConstraintValidator<ValidEmailDomain, String> {
    
    private Set<String> allowedDomains;
    
    @Override
    public void initialize(ValidEmailDomain constraintAnnotation) {
        allowedDomains = Arrays.stream(constraintAnnotation.allowedDomains())
            .collect(Collectors.toSet());
    }
    
    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        if (email == null || !email.contains("@")) {
            return true; // 让 @Email 注解处理格式校验
        }
        
        String domain = email.substring(email.indexOf("@") + 1);
        return allowedDomains.isEmpty() || allowedDomains.contains(domain);
    }
}

// 使用
public class CreateUserRequest {
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @ValidEmailDomain(allowedDomains = {"example.com", "company.com"}, 
                      message = "只允许公司邮箱注册")
    private String email;
}
```

---

### 📝 今日笔记（5 行）

1. **Specification**：JPA 动态查询条件构建
2. **JpaSpecificationExecutor**：支持动态查询的 Repository 接口
3. **Apache POI**：生成 Excel 文件
4. **自定义校验器**：实现复杂业务规则校验
5. **ResponseEntity**：控制 HTTP 响应头，支持文件下载
