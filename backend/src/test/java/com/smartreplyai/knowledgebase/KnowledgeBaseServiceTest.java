package com.smartreplyai.knowledgebase;

import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.knowledgebase.dto.CreateArticleRequest;
import com.smartreplyai.knowledgebase.dto.CsvPreviewResponse;
import com.smartreplyai.knowledgebase.dto.KnowledgeArticleDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KnowledgeBaseServiceTest {

    @Mock
    private KnowledgeArticleRepository articleRepository;

    @Mock
    private KnowledgeCategoryRepository categoryRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private com.smartreplyai.subscription.PlanLimitService planLimitService;

    @InjectMocks
    private KnowledgeBaseService knowledgeBaseService;

    @Test
    void createArticle_ShouldPersistAndReturnDto() {
        UUID businessId = UUID.randomUUID();
        CreateArticleRequest req = new CreateArticleRequest("What are your business hours?", "We are open Monday through Saturday from 9 AM to 6 PM.");
        req.setKeywords("hours, timings, schedule");
        when(planLimitService.normalizeArticleType(any())).thenReturn("FAQ");

        Business biz = new Business();
        biz.setId(businessId);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(biz));

        KnowledgeArticle article = new KnowledgeArticle(biz, null, req.getQuestion(), req.getAnswer());
        article.setId(UUID.randomUUID());
        article.setKeywords(req.getKeywords());
        when(articleRepository.save(any(KnowledgeArticle.class))).thenReturn(article);

        KnowledgeArticleDto result = knowledgeBaseService.createArticle(businessId, req);

        assertNotNull(result);
        assertEquals("What are your business hours?", result.getQuestion());
        assertEquals("We are open Monday through Saturday from 9 AM to 6 PM.", result.getAnswer());
        assertTrue(result.isActive());
        verify(articleRepository, times(1)).save(any(KnowledgeArticle.class));
    }

    @Test
    void previewCsv_ShouldValidateAndIdentifyDuplicates() {
        UUID businessId = UUID.randomUUID();
        String csvContent = "Question,Answer,Category,Keywords\n" +
                "What are your business hours?,We are open Mon-Sat 9AM-6PM,Timings,schedule\n" +
                "How do I book an appointment?,Please provide date and time,Appointments,booking\n" +
                ",Missing Question Error,General,test\n";

        InputStream stream = new ByteArrayInputStream(csvContent.getBytes(StandardCharsets.UTF_8));
        when(articleRepository.existsByBusinessIdAndQuestionIgnoreCase(eq(businessId), eq("What are your business hours?"))).thenReturn(false);
        when(articleRepository.existsByBusinessIdAndQuestionIgnoreCase(eq(businessId), eq("How do I book an appointment?"))).thenReturn(true); // Duplicate

        CsvPreviewResponse preview = knowledgeBaseService.previewCsv(businessId, stream);

        assertNotNull(preview);
        assertEquals(3, preview.getTotalRows());
        assertEquals(2, preview.getValidRows());
        assertEquals(1, preview.getDuplicateRows());
        assertEquals(1, preview.getInvalidRows());

        // Row 1: valid
        assertTrue(preview.getItems().get(0).isValid());
        assertFalse(preview.getItems().get(0).isDuplicate());

        // Row 2: duplicate
        assertTrue(preview.getItems().get(1).isDuplicate());

        // Row 3: invalid
        assertFalse(preview.getItems().get(2).isValid());
    }
}
