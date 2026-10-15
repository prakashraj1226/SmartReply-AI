package com.smartreplyai.reports;

import com.smartreplyai.appointment.AppointmentRepository;
import com.smartreplyai.conversation.Conversation;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.customer.CustomerRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.StringWriter;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class ReportsService {

    private final ConversationRepository conversationRepository;
    private final AppointmentRepository appointmentRepository;
    private final CustomerRepository customerRepository;

    public ReportsService(ConversationRepository conversationRepository,
                          AppointmentRepository appointmentRepository,
                          CustomerRepository customerRepository) {
        this.conversationRepository = conversationRepository;
        this.appointmentRepository = appointmentRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public ReportsSummaryDto getSummary(UUID businessId, String period) {
        Instant start = calculateStartTime(period);
        List<Conversation> conversations = conversationRepository.findByBusinessId(businessId, Pageable.unpaged()).getContent();

        long total = conversations.size();
        long open = conversations.stream().filter(c -> "OPEN".equalsIgnoreCase(c.getStatus())).count();
        long pending = conversations.stream().filter(c -> "PENDING".equalsIgnoreCase(c.getStatus())).count();
        long resolved = conversations.stream().filter(c -> "RESOLVED".equalsIgnoreCase(c.getStatus())).count();

        long aiHandled = conversations.stream().filter(c -> c.isAiEnabled() && !"PENDING".equalsIgnoreCase(c.getStatus())).count();
        long humanHandled = total - aiHandled;

        double resolutionRate = total > 0 ? ((double) resolved / total) * 100.0 : 0.0;
        double aiAutomationRate = total > 0 ? ((double) aiHandled / total) * 100.0 : 0.0;

        long customers = customerRepository.countByBusinessId(businessId);
        long appointments = appointmentRepository.countByBusinessIdAndStartTimeAfter(businessId, Instant.EPOCH);

        ReportsSummaryDto dto = new ReportsSummaryDto();
        dto.setTotalConversations(total);
        dto.setOpenConversations(open);
        dto.setPendingConversations(pending);
        dto.setResolvedConversations(resolved);
        dto.setResolutionRatePercentage(Math.round(resolutionRate * 10.0) / 10.0);
        dto.setAiHandledConversations(aiHandled);
        dto.setHumanHandledConversations(humanHandled);
        dto.setAiAutomationRatePercentage(Math.round(aiAutomationRate * 10.0) / 10.0);
        dto.setAvgResponseTimeSeconds(0);
        dto.setTotalCustomers(customers);
        dto.setTotalAppointments(appointments);
        dto.setConfirmedAppointments(appointments);

        return dto;
    }

    @Transactional(readOnly = true)
    public byte[] exportConversationsCsv(UUID businessId) {
        List<Conversation> conversations = conversationRepository.findByBusinessId(businessId, Pageable.unpaged()).getContent();

        try (StringWriter writer = new StringWriter();
             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.builder()
                     .setHeader("Conversation ID", "Customer Name", "Customer Phone", "Status", "AI Enabled", "Unread Count", "Last Snippet", "Last Active At")
                     .build())) {

            for (Conversation c : conversations) {
                csvPrinter.printRecord(
                        c.getId(),
                        c.getCustomer() != null ? c.getCustomer().getName() : "Unknown",
                        c.getCustomer() != null ? c.getCustomer().getPhoneNumber() : "—",
                        c.getStatus(),
                        c.isAiEnabled(),
                        c.getUnreadCount(),
                        c.getLastMessageSnippet() != null ? c.getLastMessageSnippet() : "",
                        c.getLastMessageAt() != null ? c.getLastMessageAt().toString() : c.getCreatedAt().toString()
                );
            }
            csvPrinter.flush();
            return writer.toString().getBytes();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate conversations CSV report", e);
        }
    }

    private Instant calculateStartTime(String period) {
        if (period == null) return Instant.now().minus(30, ChronoUnit.DAYS);
        return switch (period.toUpperCase()) {
            case "TODAY" -> Instant.now().truncatedTo(ChronoUnit.DAYS);
            case "7_DAYS" -> Instant.now().minus(7, ChronoUnit.DAYS);
            case "30_DAYS" -> Instant.now().minus(30, ChronoUnit.DAYS);
            default -> Instant.EPOCH; // ALL
        };
    }
}
