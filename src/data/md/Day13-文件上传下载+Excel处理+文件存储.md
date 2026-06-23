# Day 13：文件上传下载 + Excel 处理 + 文件存储

### 📚 Java 补充（30 分钟）

#### 1. 文件操作基础

```java
import java.io.*;
import java.nio.file.*;
import java.util.List;

public class FileOperations {
    
    /**
     * 读取文件内容
     */
    public static String readFile(String filePath) throws IOException {
        return Files.readString(Paths.get(filePath));
    }
    
    /**
     * 写入文件内容
     */
    public static void writeFile(String filePath, String content) throws IOException {
        Files.writeString(Paths.get(filePath), content);
    }
    
    /**
     * 复制文件
     */
    public static void copyFile(String source, String target) throws IOException {
        Files.copy(Paths.get(source), Paths.get(target), 
            StandardCopyOption.REPLACE_EXISTING);
    }
    
    /**
     * 列出目录下的文件
     */
    public static List<String> listFiles(String directory) throws IOException {
        return Files.list(Paths.get(directory))
            .map(Path::toString)
            .toList();
    }
    
    /**
     * 删除文件
     */
    public static boolean deleteFile(String filePath) throws IOException {
        return Files.deleteIfExists(Paths.get(filePath));
    }
}
```

#### 2. 文件大小格式化

```java
public class FileSizeFormatter {
    
    private static final String[] UNITS = {"B", "KB", "MB", "GB", "TB"};
    
    public static String format(long bytes) {
        if (bytes <= 0) return "0 B";
        
        int unitIndex = 0;
        double size = bytes;
        
        while (size >= 1024 && unitIndex < UNITS.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return String.format("%.2f %s", size, UNITS[unitIndex]);
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：文件上传配置

**配置 application.yml：**

```yaml
spring:
  servlet:
    multipart:
      enabled: true
      max-file-size: 10MB
      max-request-size: 100MB
      file-size-threshold: 2KB

# 文件存储配置
file:
  upload-dir: ./uploads
```

**配置类：**

```java
package com.example.demo.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FileStorageConfig {
    
    @Value("${file.upload-dir}")
    private String uploadDir;
    
    @PostConstruct
    public void init() throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
    }
    
    public Path getUploadPath() {
        return Paths.get(uploadDir);
    }
}
```

#### 任务 2：文件上传服务

```java
package com.example.demo.service;

import com.example.demo.config.FileStorageConfig;
import com.example.demo.dto.response.UploadResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class FileStorageService {
    
    private final FileStorageConfig fileStorageConfig;
    
    public FileStorageService(FileStorageConfig fileStorageConfig) {
        this.fileStorageConfig = fileStorageConfig;
    }
    
    /**
     * 上传单个文件
     */
    public UploadResponse uploadFile(MultipartFile file) throws IOException {
        // 验证文件
        validateFile(file);
        
        // 生成文件名
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String newFilename = generateFilename(extension);
        
        // 创建日期子目录
        String dateDir = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        Path uploadPath = fileStorageConfig.getUploadPath().resolve(dateDir);
        
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // 保存文件
        Path targetPath = uploadPath.resolve(newFilename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        
        // 返回结果
        return new UploadResponse(
            newFilename,
            originalFilename,
            dateDir + "/" + newFilename,
            file.getSize(),
            file.getContentType()
        );
    }
    
    /**
     * 验证文件
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("文件不能为空");
        }
        
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.contains(".")) {
            throw new RuntimeException("文件名无效");
        }
        
        // 限制文件大小（10MB）
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new RuntimeException("文件大小不能超过 10MB");
        }
    }
    
    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
    
    /**
     * 生成唯一文件名
     */
    private String generateFilename(String extension) {
        return UUID.randomUUID().toString().replace("-", "") + extension;
    }
}
```

#### 任务 3：文件上传控制器

```java
package com.example.demo.controller;

import com.example.demo.dto.response.UploadResponse;
import com.example.demo.service.FileStorageService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
public class FileController {
    
    private final FileStorageService fileStorageService;
    
    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }
    
    /**
     * 上传单个文件
     */
    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> uploadFile(@RequestParam("file") MultipartFile file) 
            throws IOException {
        UploadResponse response = fileStorageService.uploadFile(file);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 上传多个文件
     */
    @PostMapping("/upload/batch")
    public ResponseEntity<List<UploadResponse>> uploadFiles(
            @RequestParam("files") List<MultipartFile> files) throws IOException {
        
        List<UploadResponse> responses = files.stream()
            .map(file -> {
                try {
                    return fileStorageService.uploadFile(file);
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }
    
    /**
     * 上传图片（限制类型）
     */
    @PostMapping(value = "/upload/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> uploadImage(@RequestParam("file") MultipartFile file) 
            throws IOException {
        
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("只允许上传图片文件");
        }
        
        UploadResponse response = fileStorageService.uploadFile(file);
        return ResponseEntity.ok(response);
    }
}
```

#### 任务 4：文件下载服务

```java
package com.example.demo.service;

import com.example.demo.config.FileStorageConfig;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class FileDownloadService {
    
    private final FileStorageConfig fileStorageConfig;
    
    public FileDownloadService(FileStorageConfig fileStorageConfig) {
        this.fileStorageConfig = fileStorageConfig;
    }
    
    /**
     * 获取文件资源
     */
    public Resource getFile(String filePath) throws IOException {
        Path path = fileStorageConfig.getUploadPath().resolve(filePath).normalize();
        Resource resource = new UrlResource(path.toUri());
        
        if (!resource.exists() || !resource.isReadable()) {
            throw new RuntimeException("文件不存在或无法读取: " + filePath);
        }
        
        return resource;
    }
    
    /**
     * 获取文件内容字节数组
     */
    public byte[] getFileBytes(String filePath) throws IOException {
        Path path = fileStorageConfig.getUploadPath().resolve(filePath).normalize();
        
        if (!Files.exists(path)) {
            throw new RuntimeException("文件不存在: " + filePath);
        }
        
        return Files.readAllBytes(path);
    }
    
    /**
     * 获取文件 MIME 类型
     */
    public String getContentType(String filePath) throws IOException {
        Path path = fileStorageConfig.getUploadPath().resolve(filePath).normalize();
        return Files.probeContentType(path);
    }
}
```

#### 任务 5：文件下载控制器

```java
package com.example.demo.controller;

import com.example.demo.service.FileDownloadService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/files")
public class DownloadController {
    
    private final FileDownloadService fileDownloadService;
    
    public DownloadController(FileDownloadService fileDownloadService) {
        this.fileDownloadService = fileDownloadService;
    }
    
    /**
     * 下载文件
     */
    @GetMapping("/download/{filePath}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filePath) throws IOException {
        Resource resource = fileDownloadService.getFile(filePath);
        String contentType = fileDownloadService.getContentType(filePath);
        
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, 
                "attachment; filename=\"" + resource.getFilename() + "\"")
            .body(resource);
    }
    
    /**
     * 在线预览图片
     */
    @GetMapping("/preview/{filePath}")
    public ResponseEntity<Resource> previewImage(@PathVariable String filePath) throws IOException {
        Resource resource = fileDownloadService.getFile(filePath);
        String contentType = fileDownloadService.getContentType(filePath);
        
        // 验证是否为图片
        if (!contentType.startsWith("image/")) {
            throw new RuntimeException("只支持图片预览");
        }
        
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
            .body(resource);
    }
}
```

#### 任务 6：Excel 处理（Apache POI）

**添加依赖：**

```xml
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi</artifactId>
    <version>5.2.5</version>
</dependency>
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.5</version>
</dependency>
```

**Excel 服务：**

```java
package com.example.demo.service;

import com.example.demo.entity.User;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExcelService {
    
    /**
     * 从 Excel 导入用户数据
     */
    public List<User> importUsersFromExcel(MultipartFile file) throws IOException {
        List<User> users = new ArrayList<>();
        
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            
            // 跳过表头（第一行）
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                User user = new User();
                
                // 读取单元格数据
                Cell nameCell = row.getCell(0);
                Cell emailCell = row.getCell(1);
                Cell ageCell = row.getCell(2);
                
                if (nameCell != null) {
                    user.setUsername(getCellStringValue(nameCell));
                }
                if (emailCell != null) {
                    user.setEmail(getCellStringValue(emailCell));
                }
                if (ageCell != null) {
                    user.setAge(getCellIntValue(ageCell));
                }
                
                users.add(user);
            }
        }
        
        return users;
    }
    
    /**
     * 导出用户数据到 Excel
     */
    public byte[] exportUsersToExcel(List<User> users) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("用户数据");
            
            // 创建表头样式
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            // 创建表头
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "用户名", "邮箱", "年龄"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // 填充数据
            int rowNum = 1;
            for (User user : users) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(user.getId());
                row.createCell(1).setCellValue(user.getUsername());
                row.createCell(2).setCellValue(user.getEmail());
                row.createCell(3).setCellValue(user.getAge());
            }
            
            // 自动调整列宽
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }
    
    /**
     * 获取单元格字符串值
     */
    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }
    
    /**
     * 获取单元格整数值
     */
    private Integer getCellIntValue(Cell cell) {
        if (cell == null) return null;
        
        return switch (cell.getCellType()) {
            case NUMERIC -> (int) cell.getNumericCellValue();
            case STRING -> {
                try {
                    yield Integer.parseInt(cell.getStringCellValue());
                } catch (NumberFormatException e) {
                    yield null;
                }
            }
            default -> null;
        };
    }
}
```

**Excel 控制器：**

```java
package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ExcelService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/excel")
public class ExcelController {
    
    private final ExcelService excelService;
    private final UserRepository userRepository;
    
    public ExcelController(ExcelService excelService, UserRepository userRepository) {
        this.excelService = excelService;
        this.userRepository = userRepository;
    }
    
    /**
     * 导入用户数据
     */
    @PostMapping("/import")
    public ResponseEntity<List<User>> importUsers(@RequestParam("file") MultipartFile file) 
            throws IOException {
        
        List<User> users = excelService.importUsersFromExcel(file);
        
        // 保存到数据库
        List<User> savedUsers = userRepository.saveAll(users);
        
        return ResponseEntity.ok(savedUsers);
    }
    
    /**
     * 导出用户数据
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportUsers() throws IOException {
        List<User> users = userRepository.findAll();
        byte[] excelData = excelService.exportUsersToExcel(users);
        
        String filename = "users_" + LocalDateTime.now()
            .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
        
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .header(HttpHeaders.CONTENT_DISPOSITION, 
                "attachment; filename=\"" + filename + "\"")
            .body(excelData);
    }
}
```

---

### 📝 今日笔记（5 行）

1. **文件上传**：使用 `MultipartFile` 接收文件，配置 `spring.servlet.multipart` 设置上传限制
2. **文件存储**：将文件保存到服务器本地目录，使用 UUID 生成唯一文件名
3. **文件下载**：使用 `Resource` 和 `UrlResource` 返回文件资源
4. **Excel 处理**：使用 Apache POI 库读取和写入 Excel 文件
5. **文件预览**：设置正确的 Content-Type 实现在线预览