# Day 18：综合实战补充知识

### 📚 高级查询与业务逻辑（30 分钟）

#### 1. JPA 高级查询

**JPA 支持多种查询方式：**

```java
// 方法命名查询
public interface UserRepository extends JpaRepository<User, Long> {
    
    // 根据用户名查找
    Optional<User> findByName(String name);
    
    // 根据邮箱查找
    Optional<User> findByEmail(String email);
    
    // 查找年龄大于指定值的用户
    List<User> findByAgeGreaterThan(Integer age);
    
    // 按创建时间降序排序
    List<User> findAllByOrderByCreatedAtDesc();
    
    // 检查邮箱是否存在
    boolean existsByEmail(String email);
    
    // 根据名字模糊查询
    List<User> findByNameContaining(String keyword);
    
    // 组合条件查询
    List<User> findByNameContainingAndAgeGreaterThan(String name, Integer age);
    
    // 分页查询
    Page<User> findByAgeBetween(Integer minAge, Integer maxAge, Pageable pageable);
    
    // 统计
    long countByCreatedAtAfter(LocalDateTime dateTime);
}
```

**JPQL 查询：**

```java
public interface UserRepository extends JpaRepository<User, Long> {
    
    // JPQL 查询
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmailCustom(@Param("email") String email);
    
    // 复杂查询
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    List<User> findUsersByRoleName(@Param("roleName") String roleName);
    
    // 统计查询
    @Query("SELECT r.name, COUNT(u) FROM User u JOIN u.roles r GROUP BY r.name")
    List<Object[]> countByRole();
    
    // 更新查询
    @Modifying
    @Query("UPDATE User u SET u.name = :name WHERE u.id = :id")
    int updateUserName(@Param("id") Long id, @Param("name") String name);
}
```

**Specification 动态查询：**

```java
@Service
public class UserServiceImpl {
    
    @Autowired
    private UserRepository userRepository;
    
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
}
```

#### 2. 自定义校验器

**创建自定义校验注解：**

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
            return true;  // 让 @Email 注解处理格式校验
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

**自定义校验注解结构：**

| 组成部分 | 说明 |
|---------|------|
| **@Target** | 指定注解作用位置（字段、方法等） |
| **@Retention** | 指定注解生命周期（运行时保留） |
| **@Constraint** | 指定校验器类 |
| **message** | 错误消息 |
| **groups** | 校验分组 |
| **payload** | 负载信息 |

#### 3. Excel 导出

**使用 Apache POI 生成 Excel：**

```java
@Service
public class ExportService {
    
    @Autowired
    private UserRepository userRepository;
    
    public byte[] exportUsers(UserQueryRequest request) throws IOException {
        List<User> users = userRepository.findAll(buildSpecification(request));
        
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("用户列表");
            
            // 创建表头样式
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            // 创建表头
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "姓名", "邮箱", "年龄", "创建时间"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
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

**Excel 操作要点：**

| 要点 | 说明 |
|-----|------|
| **资源管理** | 使用 try-with-resources 自动关闭 Workbook |
| **样式设置** | 创建 CellStyle 和 Font 设置格式 |
| **数据类型** | 注意数字、日期等类型的正确处理 |
| **性能优化** | 大批量数据使用 SXSSFWorkbook（流式写入） |