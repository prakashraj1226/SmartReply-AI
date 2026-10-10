package com.smartreplyai.knowledgebase;

import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.knowledgebase.dto.*;
import com.smartreplyai.tenant.TenantContext;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/knowledge-base")
public class KnowledgeBaseController {

    private final KnowledgeBaseService knowledgeBaseService;

    public KnowledgeBaseController(KnowledgeBaseService knowledgeBaseService) {
        this.knowledgeBaseService = knowledgeBaseService;
    }

    // --- CATEGORIES ---

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<KnowledgeCategoryDto>>> getCategories() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        List<KnowledgeCategoryDto> categories = knowledgeBaseService.getCategories(businessId);
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<KnowledgeCategoryDto>> createCategory(@RequestBody Map<String, Object> body) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        String name = (String) body.get("name");
        int order = body.get("displayOrder") != null ? ((Number) body.get("displayOrder")).intValue() : 0;

        KnowledgeCategoryDto cat = knowledgeBaseService.createCategory(businessId, name, order);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Category created", cat));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        knowledgeBaseService.deleteCategory(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok("Category deleted", null));
    }

    // --- ARTICLES ---

    @GetMapping("/articles")
    public ResponseEntity<ApiResponse<Page<KnowledgeArticleDto>>> getArticles(
            @RequestParam(name = "categoryId", required = false) UUID categoryId,
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        Page<KnowledgeArticleDto> articles = knowledgeBaseService.getArticles(
                businessId, categoryId, query, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.ok(articles));
    }

    @GetMapping("/articles/{id}")
    public ResponseEntity<ApiResponse<KnowledgeArticleDto>> getArticleById(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        KnowledgeArticleDto article = knowledgeBaseService.getArticleById(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok(article));
    }

    @PostMapping("/articles")
    public ResponseEntity<ApiResponse<KnowledgeArticleDto>> createArticle(@Valid @RequestBody CreateArticleRequest req) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        KnowledgeArticleDto article = knowledgeBaseService.createArticle(businessId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("FAQ article created", article));
    }

    @PutMapping("/articles/{id}")
    public ResponseEntity<ApiResponse<KnowledgeArticleDto>> updateArticle(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateArticleRequest req) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        KnowledgeArticleDto article = knowledgeBaseService.updateArticle(businessId, id, req);
        return ResponseEntity.ok(ApiResponse.ok("FAQ article updated", article));
    }

    @PatchMapping("/articles/{id}/toggle")
    public ResponseEntity<ApiResponse<KnowledgeArticleDto>> toggleArticle(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        KnowledgeArticleDto article = knowledgeBaseService.toggleActive(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok("Status updated", article));
    }

    @DeleteMapping("/articles/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteArticle(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        knowledgeBaseService.deleteArticle(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok("FAQ article deleted", null));
    }

    // --- CSV PREVIEW, IMPORT & EXPORT ---

    @PostMapping(value = "/preview-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<CsvPreviewResponse>> previewCsv(@RequestParam("file") MultipartFile file) throws IOException {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");
        if (file.isEmpty()) throw new BadRequestException("CSV file cannot be empty");

        CsvPreviewResponse preview = knowledgeBaseService.previewCsv(businessId, file.getInputStream());
        return ResponseEntity.ok(ApiResponse.ok(preview));
    }

    @PostMapping(value = "/import-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> importCsv(@RequestParam("file") MultipartFile file) throws IOException {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");
        if (file.isEmpty()) throw new BadRequestException("CSV file cannot be empty");

        int importedCount = knowledgeBaseService.importCsv(businessId, file.getInputStream());
        return ResponseEntity.ok(ApiResponse.ok("Successfully imported " + importedCount + " FAQs", Map.of("importedCount", importedCount)));
    }

    @GetMapping("/export-csv")
    public ResponseEntity<byte[]> exportCsv() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        String csv = knowledgeBaseService.exportArticlesCsv(businessId);
        byte[] bytes = csv.getBytes();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"knowledge_base.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .contentLength(bytes.length)
                .body(bytes);
    }
}
