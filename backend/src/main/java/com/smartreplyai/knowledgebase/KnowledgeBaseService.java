package com.smartreplyai.knowledgebase;

import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.knowledgebase.dto.*;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class KnowledgeBaseService {

    private final KnowledgeArticleRepository articleRepository;
    private final KnowledgeCategoryRepository categoryRepository;
    private final BusinessRepository businessRepository;

    public KnowledgeBaseService(KnowledgeArticleRepository articleRepository,
                                KnowledgeCategoryRepository categoryRepository,
                                BusinessRepository businessRepository) {
        this.articleRepository = articleRepository;
        this.categoryRepository = categoryRepository;
        this.businessRepository = businessRepository;
    }

    // --- CATEGORIES ---

    @Transactional(readOnly = true)
    public List<KnowledgeCategoryDto> getCategories(UUID businessId) {
        return categoryRepository.findByBusinessIdOrderByDisplayOrderAsc(businessId)
                .stream()
                .map(KnowledgeCategoryDto::fromEntity)
                .toList();
    }

    @Transactional
    public KnowledgeCategoryDto createCategory(UUID businessId, String name, int displayOrder) {
        if (name == null || name.isBlank()) {
            throw new BadRequestException("Category name is required");
        }
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        KnowledgeCategory category = new KnowledgeCategory(business, name.trim(), displayOrder);
        category = categoryRepository.save(category);
        return KnowledgeCategoryDto.fromEntity(category);
    }

    @Transactional
    public void deleteCategory(UUID businessId, UUID categoryId) {
        KnowledgeCategory category = categoryRepository.findByBusinessIdAndId(businessId, categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        categoryRepository.delete(category);
    }

    // --- ARTICLES ---

    @Transactional(readOnly = true)
    public Page<KnowledgeArticleDto> getArticles(UUID businessId, UUID categoryId, String query, Pageable pageable) {
        Page<KnowledgeArticle> page;
        if (query != null && !query.isBlank()) {
            page = articleRepository.searchArticles(businessId, query.trim(), pageable);
        } else if (categoryId != null) {
            page = articleRepository.findByBusinessIdAndCategoryId(businessId, categoryId, pageable);
        } else {
            page = articleRepository.findByBusinessId(businessId, pageable);
        }
        return page.map(KnowledgeArticleDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public KnowledgeArticleDto getArticleById(UUID businessId, UUID id) {
        KnowledgeArticle article = articleRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("FAQ article not found"));
        return KnowledgeArticleDto.fromEntity(article);
    }

    @Transactional
    public KnowledgeArticleDto createArticle(UUID businessId, CreateArticleRequest req) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        KnowledgeCategory category = null;
        if (req.getCategoryId() != null) {
            category = categoryRepository.findByBusinessIdAndId(businessId, req.getCategoryId())
                    .orElse(null);
        }

        KnowledgeArticle article = new KnowledgeArticle();
        article.setBusiness(business);
        article.setCategory(category);
        article.setQuestion(req.getQuestion().trim());
        article.setAnswer(req.getAnswer().trim());
        article.setKeywords(req.getKeywords());
        article.setActive(req.getIsActive() != null ? req.getIsActive() : true);

        article = articleRepository.save(article);
        return KnowledgeArticleDto.fromEntity(article);
    }

    @Transactional
    public KnowledgeArticleDto updateArticle(UUID businessId, UUID id, UpdateArticleRequest req) {
        KnowledgeArticle article = articleRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("FAQ article not found"));

        if (req.getCategoryId() != null) {
            KnowledgeCategory cat = categoryRepository.findByBusinessIdAndId(businessId, req.getCategoryId()).orElse(null);
            article.setCategory(cat);
        }
        if (req.getQuestion() != null && !req.getQuestion().isBlank()) article.setQuestion(req.getQuestion().trim());
        if (req.getAnswer() != null && !req.getAnswer().isBlank()) article.setAnswer(req.getAnswer().trim());
        if (req.getKeywords() != null) article.setKeywords(req.getKeywords());
        if (req.getIsActive() != null) article.setActive(req.getIsActive());

        article = articleRepository.save(article);
        return KnowledgeArticleDto.fromEntity(article);
    }

    @Transactional
    public void deleteArticle(UUID businessId, UUID id) {
        KnowledgeArticle article = articleRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("FAQ article not found"));
        articleRepository.delete(article);
    }

    @Transactional
    public KnowledgeArticleDto toggleActive(UUID businessId, UUID id) {
        KnowledgeArticle article = articleRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("FAQ article not found"));
        article.setActive(!article.isActive());
        article = articleRepository.save(article);
        return KnowledgeArticleDto.fromEntity(article);
    }

    // --- CSV IMPORT / EXPORT & VALIDATION ---

    @Transactional(readOnly = true)
    public CsvPreviewResponse previewCsv(UUID businessId, InputStream inputStream) {
        List<CsvPreviewItem> items = new ArrayList<>();
        int valid = 0, duplicates = 0, invalid = 0;

        try (CSVParser parser = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build()
                .parse(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {

            int rowIndex = 1;
            Set<String> seenInFile = new HashSet<>();

            for (CSVRecord record : parser) {
                String question = record.isMapped("Question") ? record.get("Question") : (record.size() > 0 ? record.get(0) : "");
                String answer = record.isMapped("Answer") ? record.get("Answer") : (record.size() > 1 ? record.get(1) : "");
                String category = record.isMapped("Category") ? record.get("Category") : (record.size() > 2 ? record.get(2) : "");
                String keywords = record.isMapped("Keywords") ? record.get("Keywords") : (record.size() > 3 ? record.get(3) : "");

                CsvPreviewItem item = new CsvPreviewItem(rowIndex++, question, answer, category, keywords);

                if (question == null || question.isBlank() || answer == null || answer.isBlank()) {
                    item.setValid(false);
                    item.setValidationError("Both Question and Answer fields are required");
                    invalid++;
                } else if (seenInFile.contains(question.toLowerCase()) ||
                           articleRepository.existsByBusinessIdAndQuestionIgnoreCase(businessId, question)) {
                    item.setDuplicate(true);
                    item.setValidationError("Duplicate: question already exists");
                    duplicates++;
                    valid++;
                } else {
                    seenInFile.add(question.toLowerCase());
                    valid++;
                }

                items.add(item);
            }
        } catch (Exception e) {
            throw new BadRequestException("Failed to parse CSV file: " + e.getMessage());
        }

        return new CsvPreviewResponse(items.size(), valid, duplicates, invalid, items);
    }

    @Transactional
    public int importCsv(UUID businessId, InputStream inputStream) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        int importedCount = 0;

        try (CSVParser parser = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build()
                .parse(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {

            Map<String, KnowledgeCategory> categoryCache = new HashMap<>();

            for (CSVRecord record : parser) {
                String question = record.isMapped("Question") ? record.get("Question") : (record.size() > 0 ? record.get(0) : "");
                String answer = record.isMapped("Answer") ? record.get("Answer") : (record.size() > 1 ? record.get(1) : "");
                String catName = record.isMapped("Category") ? record.get("Category") : (record.size() > 2 ? record.get(2) : "");
                String keywords = record.isMapped("Keywords") ? record.get("Keywords") : (record.size() > 3 ? record.get(3) : "");

                if (question == null || question.isBlank() || answer == null || answer.isBlank()) {
                    continue; // Skip invalid row
                }

                if (articleRepository.existsByBusinessIdAndQuestionIgnoreCase(businessId, question.trim())) {
                    continue; // Skip duplicate
                }

                KnowledgeCategory category = null;
                if (catName != null && !catName.isBlank()) {
                    String cleanCat = catName.trim();
                    category = categoryCache.computeIfAbsent(cleanCat.toLowerCase(), key ->
                            categoryRepository.findByBusinessIdAndNameIgnoreCase(businessId, cleanCat)
                                    .orElseGet(() -> categoryRepository.save(new KnowledgeCategory(business, cleanCat, 0)))
                    );
                }

                KnowledgeArticle article = new KnowledgeArticle(business, category, question.trim(), answer.trim());
                article.setKeywords(keywords);
                article.setActive(true);
                articleRepository.save(article);
                importedCount++;
            }
        } catch (Exception e) {
            throw new BadRequestException("Failed to import CSV: " + e.getMessage());
        }

        return importedCount;
    }

    @Transactional(readOnly = true)
    public String exportArticlesCsv(UUID businessId) {
        List<KnowledgeArticle> articles = articleRepository.findByBusinessIdAndIsActiveTrue(businessId);
        StringWriter sw = new StringWriter();

        try (CSVPrinter printer = new CSVPrinter(sw, CSVFormat.DEFAULT.builder()
                .setHeader("Question", "Answer", "Category", "Keywords")
                .build())) {

            for (KnowledgeArticle a : articles) {
                printer.printRecord(
                        a.getQuestion(),
                        a.getAnswer(),
                        a.getCategory() != null ? a.getCategory().getName() : "General",
                        a.getKeywords() != null ? a.getKeywords() : ""
                );
            }
        } catch (Exception e) {
            throw new RuntimeException("Error exporting articles to CSV", e);
        }

        return sw.toString();
    }
}
