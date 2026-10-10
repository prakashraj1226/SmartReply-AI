package com.smartreplyai.business;

import com.smartreplyai.business.dto.BusinessDto;
import com.smartreplyai.business.dto.UpdateBusinessProfileRequest;
import com.smartreplyai.common.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class BusinessService {

    private final BusinessRepository businessRepository;
    private final com.smartreplyai.knowledgebase.KnowledgeArticleRepository articleRepository;

    public BusinessService(BusinessRepository businessRepository,
                           com.smartreplyai.knowledgebase.KnowledgeArticleRepository articleRepository) {
        this.businessRepository = businessRepository;
        this.articleRepository = articleRepository;
    }

    @Transactional(readOnly = true)
    public BusinessDto getBusinessById(UUID businessId) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found with ID: " + businessId));
        return BusinessDto.fromEntity(business);
    }

    @Transactional
    public BusinessDto updateBusinessProfile(UUID businessId, UpdateBusinessProfileRequest request) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found with ID: " + businessId));

        if (request.getName() != null && !request.getName().isBlank()) {
            business.setName(request.getName().trim());
        }
        if (request.getCategory() != null) business.setCategory(request.getCategory());
        if (request.getEmail() != null) business.setEmail(request.getEmail());
        if (request.getPhone() != null) business.setPhone(request.getPhone());
        if (request.getAddress() != null) business.setAddress(request.getAddress());
        if (request.getTimezone() != null) business.setTimezone(request.getTimezone());
        if (request.getOperatingHoursJson() != null) business.setOperatingHoursJson(request.getOperatingHoursJson());
        if (request.getPreferredLanguage() != null) business.setPreferredLanguage(request.getPreferredLanguage());
        if (request.getDescription() != null) business.setDescription(request.getDescription());
        if (request.getOnboardingCompleted() != null) business.setOnboardingCompleted(request.getOnboardingCompleted());

        business = businessRepository.save(business);
        return BusinessDto.fromEntity(business);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSetupChecklist(UUID businessId) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        boolean profileComplete = business.getDescription() != null && !business.getDescription().isBlank() &&
                business.getPhone() != null && !business.getPhone().isBlank();

        boolean faqAdded = articleRepository.countByBusinessId(businessId) > 0;

        Map<String, Object> checklist = new HashMap<>();
        checklist.put("profileCompleted", profileComplete);
        checklist.put("faqAdded", faqAdded);
        checklist.put("whatsappConnected", false);
        checklist.put("aiTuned", true);
        checklist.put("assistantTested", false);
        checklist.put("allCompleted", business.isOnboardingCompleted());

        return checklist;
    }
}
