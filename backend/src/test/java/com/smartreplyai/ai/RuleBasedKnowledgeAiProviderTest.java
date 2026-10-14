package com.smartreplyai.ai;

import com.smartreplyai.ai.dto.AiGenerationRequest;
import com.smartreplyai.ai.dto.AiGenerationResponse;
import com.smartreplyai.ai.provider.RuleBasedKnowledgeAiProvider;
import com.smartreplyai.business.Business;
import com.smartreplyai.knowledgebase.KnowledgeArticle;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class RuleBasedKnowledgeAiProviderTest {

    private RuleBasedKnowledgeAiProvider provider;

    @BeforeEach
    void setUp() {
        provider = new RuleBasedKnowledgeAiProvider();
    }

    @Test
    void generateReply_WhenQuestionMatchesKnowledge_ShouldReturnGroundedAnswer() {
        Business biz = new Business();
        biz.setName("SmileCare Dental Hospital");

        KnowledgeArticle article1 = new KnowledgeArticle(biz, null,
                "What are your clinic operating hours?",
                "We are open Monday through Saturday from 9:00 AM to 7:00 PM. Closed on Sundays.");
        article1.setKeywords("hours, timings, open, timing");

        KnowledgeArticle article2 = new KnowledgeArticle(biz, null,
                "What are your dental implant charges?",
                "Dental implants start from ₹25,000 per tooth.");
        article2.setKeywords("implants, cost, price");

        AiGenerationRequest req = new AiGenerationRequest();
        req.setBusinessName("SmileCare Dental Hospital");
        req.setAssistantName("SmileCare AI");
        req.setCustomerMessage("What are your clinic timings?");
        req.setApprovedKnowledge(List.of(article1, article2));
        req.setConfidenceThreshold(0.70);
        req.setTone("PROFESSIONAL");

        AiGenerationResponse resp = provider.generateReply(req);

        assertNotNull(resp);
        assertFalse(resp.isEscalated(), "Should not escalate when confident answer exists");
        assertTrue(resp.getConfidenceScore() >= 0.70);
        assertEquals("We are open Monday through Saturday from 9:00 AM to 7:00 PM. Closed on Sundays.", resp.getReplyText());
        assertEquals(article1.getQuestion(), resp.getMatchedQuestion());
    }

    @Test
    void generateReply_WhenNoKnowledgeMatches_ShouldTriggerFallbackWithoutHallucination() {
        Business biz = new Business();
        biz.setName("SmileCare Dental Hospital");

        KnowledgeArticle article = new KnowledgeArticle(biz, null,
                "What are your clinic operating hours?",
                "We are open Monday through Saturday from 9:00 AM to 7:00 PM.");

        AiGenerationRequest req = new AiGenerationRequest();
        req.setBusinessName("SmileCare Dental Hospital");
        req.setCustomerMessage("Do you offer heart surgery and what is the cost?");
        req.setApprovedKnowledge(List.of(article));
        req.setConfidenceThreshold(0.70);
        req.setFallbackMessage("Sorry, I don't have that information. Transferring to our human team.");

        AiGenerationResponse resp = provider.generateReply(req);

        assertNotNull(resp);
        assertTrue(resp.isEscalated(), "Should trigger escalation for unapproved query");
        assertTrue(resp.getReplyText().contains("Transferring to our human team"));
        assertNull(resp.getMatchedArticleId());
    }

    @Test
    void generateReply_WhenCustomerSendsGreeting_ShouldReturnPoliteIntroduction() {
        AiGenerationRequest req = new AiGenerationRequest();
        req.setBusinessName("SmileCare Dental");
        req.setAssistantName("SmileCare AI");
        req.setCustomerMessage("Hello, good morning!");
        req.setApprovedKnowledge(List.of());

        AiGenerationResponse resp = provider.generateReply(req);

        assertNotNull(resp);
        assertFalse(resp.isEscalated());
        assertTrue(resp.getReplyText().contains("SmileCare AI"));
    }

    @Test
    void generateReply_WhenCustomerAsksAboutServices_ShouldReturnGroundedCatalogList() {
        Business biz = new Business();
        biz.setName("Luxe Hair Lounge");

        com.smartreplyai.servicecatalog.ServiceItem s1 = new com.smartreplyai.servicecatalog.ServiceItem(
                biz, null, "Haircut & Styling", "HAIR", 45, java.math.BigDecimal.valueOf(600)
        );
        com.smartreplyai.servicecatalog.ServiceItem s2 = new com.smartreplyai.servicecatalog.ServiceItem(
                biz, null, "Keratin Spa Treatment", "HAIR", 90, java.math.BigDecimal.valueOf(2500)
        );

        AiGenerationRequest req = new AiGenerationRequest();
        req.setBusinessName("Luxe Hair Lounge");
        req.setCustomerMessage("What services and treatments do you offer?");
        req.setServices(List.of(s1, s2));

        AiGenerationResponse resp = provider.generateReply(req);

        assertNotNull(resp);
        assertFalse(resp.isEscalated());
        assertTrue(resp.getReplyText().contains("Haircut & Styling"));
        assertTrue(resp.getReplyText().contains("Keratin Spa Treatment"));
        assertTrue(resp.getReplyText().contains("600"));
    }

    @Test
    void generateReply_WhenCustomerAsksAboutDoctors_ShouldReturnGroundedStaffList() {
        Business biz = new Business();
        biz.setName("Apollo Clinic");

        com.smartreplyai.staff.Staff st1 = new com.smartreplyai.staff.Staff(biz, null, "Dr. Priya Nair", "General Physician", "+919876543210", "priya@apollo.com");
        com.smartreplyai.staff.Staff st2 = new com.smartreplyai.staff.Staff(biz, null, "Dr. Ramesh Kumar", "Cardiologist", "+919876543211", "ramesh@apollo.com");

        AiGenerationRequest req = new AiGenerationRequest();
        req.setBusinessName("Apollo Clinic");
        req.setCustomerMessage("Who is the doctor available at your clinic?");
        req.setStaffMembers(List.of(st1, st2));

        AiGenerationResponse resp = provider.generateReply(req);

        assertNotNull(resp);
        assertFalse(resp.isEscalated());
        assertTrue(resp.getReplyText().contains("Dr. Priya Nair"));
        assertTrue(resp.getReplyText().contains("Cardiologist"));
    }

    @Test
    void generateReply_WhenCustomerAsksAboutSlots_ShouldReturnAvailableSlotsList() {
        com.smartreplyai.appointment.AppointmentService mockAptService = org.mockito.Mockito.mock(com.smartreplyai.appointment.AppointmentService.class);
        RuleBasedKnowledgeAiProvider providerWithMock = new RuleBasedKnowledgeAiProvider(mockAptService);

        UUID bizId = UUID.randomUUID();
        Business biz = new Business();
        biz.setId(bizId);
        biz.setName("SmileCare Dental");

        com.smartreplyai.servicecatalog.ServiceItem service = new com.smartreplyai.servicecatalog.ServiceItem(
                biz, null, "Teeth Cleaning", "DENTAL", 30, java.math.BigDecimal.valueOf(1000)
        );
        service.setId(UUID.randomUUID());

        com.smartreplyai.appointment.dto.TimeSlotDto slot1 = new com.smartreplyai.appointment.dto.TimeSlotDto(
                java.time.Instant.now(), java.time.Instant.now().plusSeconds(1800), "10:00 - 10:30", true
        );
        com.smartreplyai.appointment.dto.TimeSlotDto slot2 = new com.smartreplyai.appointment.dto.TimeSlotDto(
                java.time.Instant.now().plusSeconds(3600), java.time.Instant.now().plusSeconds(5400), "11:00 - 11:30", true
        );

        org.mockito.Mockito.when(mockAptService.getAvailableSlots(org.mockito.ArgumentMatchers.eq(bizId), org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.eq(service.getId()), org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(slot1, slot2));

        AiGenerationRequest req = new AiGenerationRequest();
        req.setBusinessId(bizId);
        req.setBusinessName("SmileCare Dental");
        req.setCustomerMessage("What slots are available for teeth cleaning tomorrow?");
        req.setServices(List.of(service));

        AiGenerationResponse resp = providerWithMock.generateReply(req);

        assertNotNull(resp);
        assertFalse(resp.isEscalated());
        assertTrue(resp.getReplyText().contains("10:00 - 10:30"));
        assertTrue(resp.getReplyText().contains("11:00 - 11:30"));
    }

    @Test
    void generateReply_WhenCustomerSpecifiesTime_ShouldBookAppointmentSafely() {
        com.smartreplyai.appointment.AppointmentService mockAptService = org.mockito.Mockito.mock(com.smartreplyai.appointment.AppointmentService.class);
        RuleBasedKnowledgeAiProvider providerWithMock = new RuleBasedKnowledgeAiProvider(mockAptService);

        UUID bizId = UUID.randomUUID();
        Business biz = new Business();
        biz.setId(bizId);
        biz.setName("SmileCare Dental");

        com.smartreplyai.servicecatalog.ServiceItem service = new com.smartreplyai.servicecatalog.ServiceItem(
                biz, null, "Teeth Cleaning", "DENTAL", 30, java.math.BigDecimal.valueOf(1000)
        );
        service.setId(UUID.randomUUID());

        java.time.Instant start = java.time.Instant.now().plusSeconds(86400);
        java.time.Instant end = start.plusSeconds(1800);

        com.smartreplyai.appointment.dto.TimeSlotDto slot = new com.smartreplyai.appointment.dto.TimeSlotDto(
                start, end, "10:00 - 10:30", true
        );

        org.mockito.Mockito.when(mockAptService.getAvailableSlots(org.mockito.ArgumentMatchers.eq(bizId), org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.eq(service.getId()), org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(slot));

        com.smartreplyai.appointment.dto.AppointmentDto mockBooked = new com.smartreplyai.appointment.dto.AppointmentDto();
        mockBooked.setId(UUID.randomUUID());
        mockBooked.setServiceName("Teeth Cleaning");
        mockBooked.setStaffName("Dr. Anita");
        mockBooked.setStartTime(start);
        mockBooked.setEndTime(end);
        mockBooked.setStatus("CONFIRMED");

        org.mockito.Mockito.when(mockAptService.createAppointment(org.mockito.ArgumentMatchers.eq(bizId), org.mockito.ArgumentMatchers.any()))
                .thenReturn(mockBooked);

        AiGenerationRequest req = new AiGenerationRequest();
        req.setBusinessId(bizId);
        req.setBusinessName("SmileCare Dental");
        req.setCustomerName("Rajesh");
        req.setCustomerPhoneNumber("+919876543210");
        req.setCustomerMessage("Please book Teeth Cleaning tomorrow at 10:00");
        req.setServices(List.of(service));

        AiGenerationResponse resp = providerWithMock.generateReply(req);

        assertNotNull(resp);
        assertFalse(resp.isEscalated());
        assertTrue(resp.getReplyText().contains("appointment has been successfully confirmed"));
        assertTrue(resp.getReplyText().contains("Teeth Cleaning"));
        org.mockito.Mockito.verify(mockAptService).createAppointment(org.mockito.ArgumentMatchers.eq(bizId), org.mockito.ArgumentMatchers.any());
    }
}
