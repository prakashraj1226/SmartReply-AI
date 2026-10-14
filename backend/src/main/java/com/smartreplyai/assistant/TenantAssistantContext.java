package com.smartreplyai.assistant;

import com.smartreplyai.appointment.Appointment;
import com.smartreplyai.appointment.AppointmentRepository;
import com.smartreplyai.branch.Branch;
import com.smartreplyai.branch.BranchRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.knowledgebase.KnowledgeArticle;
import com.smartreplyai.knowledgebase.KnowledgeArticleRepository;
import com.smartreplyai.servicecatalog.ServiceItem;
import com.smartreplyai.servicecatalog.ServiceItemRepository;
import com.smartreplyai.staff.Staff;
import com.smartreplyai.staff.StaffRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class TenantAssistantContext {

    private static final int MAX_ITEMS = 20;

    private final BusinessRepository businessRepository;
    private final BranchRepository branchRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final StaffRepository staffRepository;
    private final KnowledgeArticleRepository knowledgeArticleRepository;
    private final AppointmentRepository appointmentRepository;
    private final CustomerRepository customerRepository;
    private final ConversationRepository conversationRepository;

    public TenantAssistantContext(BusinessRepository businessRepository,
                                  BranchRepository branchRepository,
                                  ServiceItemRepository serviceItemRepository,
                                  StaffRepository staffRepository,
                                  KnowledgeArticleRepository knowledgeArticleRepository,
                                  AppointmentRepository appointmentRepository,
                                  CustomerRepository customerRepository,
                                  ConversationRepository conversationRepository) {
        this.businessRepository = businessRepository;
        this.branchRepository = branchRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.staffRepository = staffRepository;
        this.knowledgeArticleRepository = knowledgeArticleRepository;
        this.appointmentRepository = appointmentRepository;
        this.customerRepository = customerRepository;
        this.conversationRepository = conversationRepository;
    }

    @Transactional(readOnly = true)
    public String build(UUID businessId) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        ZoneId zone = zoneOf(business.getTimezone());
        DateTimeFormatter when = DateTimeFormatter.ofPattern("EEE d MMM yyyy, h:mm a").withZone(zone);
        StringBuilder prompt = new StringBuilder();
        prompt.append("""
                You are SmartReply AI for this one business. Answer only from the workspace data below.
                If a fact is not listed, say you do not have it in this workspace. Do not invent prices, hours, staff, customers, or bookings.
                Answer in short sentences. Use the same language as the user's question when you can.
                """);
        prompt.append("\nCurrent time: ").append(when.format(Instant.now())).append(" (").append(zone).append(")\n");
        prompt.append("\nBusiness\n");
        line(prompt, "Name", business.getName());
        line(prompt, "Category", business.getCategory());
        line(prompt, "Industry", business.getIndustryType());
        line(prompt, "Phone", business.getPhone());
        line(prompt, "Email", business.getEmail());
        line(prompt, "Address", business.getAddress());
        line(prompt, "Language", business.getPreferredLanguage());
        line(prompt, "Description", clip(business.getDescription(), 500));
        line(prompt, "Hours", clip(business.getOperatingHoursJson(), 800));

        prompt.append("\nBranches\n");
        List<Branch> branches = branchRepository.findByBusinessIdAndIsActiveTrue(businessId);
        if (branches.isEmpty()) {
            prompt.append("- none saved\n");
        } else {
            for (Branch branch : branches.stream().limit(MAX_ITEMS).toList()) {
                prompt.append("- ").append(blank(branch.getName()));
                if (branch.getAddress() != null && !branch.getAddress().isBlank()) {
                    prompt.append(", ").append(clip(branch.getAddress(), 160));
                }
                if (branch.getPhone() != null && !branch.getPhone().isBlank()) {
                    prompt.append(", phone ").append(branch.getPhone());
                }
                prompt.append('\n');
            }
        }

        prompt.append("\nServices\n");
        List<ServiceItem> services = serviceItemRepository.findByBusinessIdAndIsActiveTrue(businessId);
        if (services.isEmpty()) {
            prompt.append("- none saved\n");
        } else {
            for (ServiceItem service : services.stream().limit(MAX_ITEMS).toList()) {
                prompt.append("- ").append(blank(service.getName()))
                        .append(", ").append(service.getDurationMinutes()).append(" min, ")
                        .append(service.getCurrency()).append(' ').append(service.getPrice());
                if (service.getCategory() != null && !service.getCategory().isBlank()) {
                    prompt.append(", ").append(service.getCategory());
                }
                prompt.append('\n');
            }
        }

        prompt.append("\nStaff\n");
        List<Staff> staff = staffRepository.findByBusinessIdAndIsActiveTrue(businessId);
        if (staff.isEmpty()) {
            prompt.append("- none saved\n");
        } else {
            for (Staff person : staff.stream().limit(MAX_ITEMS).toList()) {
                prompt.append("- ").append(blank(person.getName())).append(" (").append(blank(person.getStaffType())).append(")\n");
            }
        }

        prompt.append("\nFAQs\n");
        List<KnowledgeArticle> articles = knowledgeArticleRepository.findByBusinessIdAndIsActiveTrue(businessId);
        if (articles.isEmpty()) {
            prompt.append("- none saved\n");
        } else {
            int shown = 0;
            for (KnowledgeArticle article : articles) {
                if (shown++ >= 25) {
                    break;
                }
                prompt.append("Q: ").append(clip(article.getQuestion(), 200)).append('\n');
                prompt.append("A: ").append(clip(article.getAnswer(), 400)).append('\n');
            }
        }

        Instant start = Instant.now().minus(1, ChronoUnit.HOURS);
        Instant end = Instant.now().plus(7, ChronoUnit.DAYS);
        List<Appointment> upcoming = appointmentRepository.findActiveAppointmentsInRange(businessId, null, null, start, end);
        prompt.append("\nUpcoming appointments\n");
        if (upcoming.isEmpty()) {
            prompt.append("- none in the next 7 days\n");
        } else {
            int shown = 0;
            for (Appointment appointment : upcoming) {
                if (shown++ >= 10) {
                    break;
                }
                String customer = appointment.getCustomer() != null ? appointment.getCustomer().getName() : "Customer";
                prompt.append("- ").append(when.format(appointment.getStartTime()))
                        .append(": ").append(blank(customer))
                        .append(", ").append(blank(appointment.getServiceName()));
                if (appointment.getStaffName() != null && !appointment.getStaffName().isBlank()) {
                    prompt.append(", ").append(appointment.getStaffName());
                }
                prompt.append(", ").append(blank(appointment.getStatus())).append('\n');
            }
        }

        long openChats = conversationRepository
                .findByBusinessIdAndStatus(businessId, "OPEN", PageRequest.of(0, 1))
                .getTotalElements();
        prompt.append("\nCounts\n");
        prompt.append("- Customers: ").append(customerRepository.countByBusinessId(businessId)).append('\n');
        prompt.append("- Conversations: ").append(conversationRepository.countByBusinessId(businessId)).append('\n');
        prompt.append("- Open conversations: ").append(openChats).append('\n');
        return prompt.toString();
    }

    private static ZoneId zoneOf(String timezone) {
        try {
            return timezone == null || timezone.isBlank() ? ZoneId.of("Asia/Kolkata") : ZoneId.of(timezone);
        } catch (Exception ex) {
            return ZoneId.of("Asia/Kolkata");
        }
    }

    private static void line(StringBuilder prompt, String label, String value) {
        prompt.append("- ").append(label).append(": ").append(blank(value)).append('\n');
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? "not set" : value.trim();
    }

    private static String clip(String value, int max) {
        if (value == null || value.isBlank()) {
            return "not set";
        }
        String trimmed = value.trim().replaceAll("\\s+", " ");
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max) + "...";
    }
}
