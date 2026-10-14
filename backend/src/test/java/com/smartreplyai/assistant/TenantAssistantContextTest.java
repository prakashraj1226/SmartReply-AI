package com.smartreplyai.assistant;

import com.smartreplyai.appointment.AppointmentRepository;
import com.smartreplyai.branch.BranchRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.knowledgebase.KnowledgeArticle;
import com.smartreplyai.knowledgebase.KnowledgeArticleRepository;
import com.smartreplyai.servicecatalog.ServiceItemRepository;
import com.smartreplyai.staff.StaffRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenantAssistantContextTest {

    @Mock private BusinessRepository businessRepository;
    @Mock private BranchRepository branchRepository;
    @Mock private ServiceItemRepository serviceItemRepository;
    @Mock private StaffRepository staffRepository;
    @Mock private KnowledgeArticleRepository knowledgeArticleRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private ConversationRepository conversationRepository;
    @InjectMocks private TenantAssistantContext context;

    @Test
    void build_usesOnlyTheRequestedBusiness() {
        UUID businessId = UUID.randomUUID();
        Business business = new Business("SmileCare Dental", "smilecare", "Healthcare", "hi@smile.test", "9000000000");
        business.setDescription("Family dental clinic");
        KnowledgeArticle article = new KnowledgeArticle(business, null, "What are your hours?", "We open at 9 AM.");

        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(branchRepository.findByBusinessIdAndIsActiveTrue(businessId)).thenReturn(List.of());
        when(serviceItemRepository.findByBusinessIdAndIsActiveTrue(businessId)).thenReturn(List.of());
        when(staffRepository.findByBusinessIdAndIsActiveTrue(businessId)).thenReturn(List.of());
        when(knowledgeArticleRepository.findByBusinessIdAndIsActiveTrue(businessId)).thenReturn(List.of(article));
        when(appointmentRepository.findActiveAppointmentsInRange(eq(businessId), isNull(), isNull(), any(), any())).thenReturn(List.of());
        when(customerRepository.countByBusinessId(businessId)).thenReturn(4L);
        when(conversationRepository.countByBusinessId(businessId)).thenReturn(2L);
        when(conversationRepository.findByBusinessIdAndStatus(eq(businessId), eq("OPEN"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        String prompt = context.build(businessId);

        assertTrue(prompt.contains("SmileCare Dental"));
        assertTrue(prompt.contains("We open at 9 AM."));
        assertTrue(prompt.contains("Customers: 4"));
        assertFalse(prompt.contains("another business"));
        verify(knowledgeArticleRepository).findByBusinessIdAndIsActiveTrue(businessId);
    }
}
