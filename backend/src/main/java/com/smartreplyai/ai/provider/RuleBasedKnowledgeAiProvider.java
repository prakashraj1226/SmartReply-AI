package com.smartreplyai.ai.provider;

import com.smartreplyai.ai.AiProvider;
import com.smartreplyai.ai.dto.AiGenerationRequest;
import com.smartreplyai.ai.dto.AiGenerationResponse;
import com.smartreplyai.appointment.AppointmentService;
import com.smartreplyai.appointment.dto.AppointmentDto;
import com.smartreplyai.appointment.dto.CreateAppointmentRequest;
import com.smartreplyai.appointment.dto.TimeSlotDto;
import com.smartreplyai.knowledgebase.KnowledgeArticle;
import com.smartreplyai.servicecatalog.ServiceItem;
import com.smartreplyai.staff.Staff;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public class RuleBasedKnowledgeAiProvider implements AiProvider {

    private static final Logger logger = LoggerFactory.getLogger(RuleBasedKnowledgeAiProvider.class);

    private final AppointmentService appointmentService;

    public RuleBasedKnowledgeAiProvider() {
        this.appointmentService = null;
    }

    @Autowired
    public RuleBasedKnowledgeAiProvider(@Lazy AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @Override
    public String getProviderName() {
        return "GROUNDED_KNOWLEDGE_ENGINE";
    }

    @Override
    public AiGenerationResponse generateReply(AiGenerationRequest req) {
        long startTime = System.currentTimeMillis();
        String customerText = req.getCustomerMessage() != null ? req.getCustomerMessage().trim().toLowerCase() : "";

        // 1. Handle common greetings gracefully
        if (isGreeting(customerText)) {
            String greeting = req.getAssistantName() != null
                    ? "Hello! I am " + req.getAssistantName() + ", automated assistant for " + req.getBusinessName() + ". How may I assist you today? Feel free to ask about our services, pricing, or available appointment slots!"
                    : "Hello! Welcome to " + req.getBusinessName() + ". How can I help you today? You can inquire about our services, timings, or book an appointment.";
            long elapsed = System.currentTimeMillis() - startTime;
            return new AiGenerationResponse(greeting, 0.98, false, null, "Greeting", 25, elapsed, getProviderName());
        }

        // 2. Appointment Availability & Safe Booking Intent Engine
        if (isAppointmentIntent(customerText) && appointmentService != null && req.getBusinessId() != null) {
            try {
                AiGenerationResponse bookingResp = handleAppointmentIntent(req, customerText, startTime);
                if (bookingResp != null) {
                    return bookingResp;
                }
            } catch (Exception e) {
                logger.warn("Error handling AI appointment intent: {}", e.getMessage());
            }
        }

        // 3. Service Catalog & Pricing Grounding
        if (isServiceInquiryIntent(customerText) && req.getServices() != null && !req.getServices().isEmpty()) {
            AiGenerationResponse serviceResp = handleServiceInquiry(req, customerText, startTime);
            if (serviceResp != null) {
                return serviceResp;
            }
        }

        // 4. Staff / Specialists Grounding
        if (isStaffInquiryIntent(customerText) && req.getStaffMembers() != null && !req.getStaffMembers().isEmpty()) {
            AiGenerationResponse staffResp = handleStaffInquiry(req, startTime);
            if (staffResp != null) {
                return staffResp;
            }
        }

        // 5. Operating Hours Grounding
        if (isOperatingHoursIntent(customerText) && req.getOperatingHours() != null && !req.getOperatingHours().isBlank()) {
            String hoursReply = "Our operating hours at " + req.getBusinessName() + " are: " + req.getOperatingHours()
                    + ". Would you like to schedule a visit or consultation?";
            long elapsed = System.currentTimeMillis() - startTime;
            return new AiGenerationResponse(hoursReply, 0.95, false, null, "Operating Hours", 30, elapsed, getProviderName());
        }

        // 6. Knowledge Base (FAQ) Article Match
        KnowledgeArticle bestMatch = null;
        double highestScore = 0.0;

        if (req.getApprovedKnowledge() != null) {
            for (KnowledgeArticle article : req.getApprovedKnowledge()) {
                if (!article.isActive()) continue;

                double score = calculateMatchScore(customerText, article);
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = article;
                }
            }
        }

        long elapsed = System.currentTimeMillis() - startTime;

        if (bestMatch != null && highestScore >= req.getConfidenceThreshold()) {
            String tailoredReply = formatWithTone(bestMatch.getAnswer(), req.getTone());
            return new AiGenerationResponse(
                    tailoredReply,
                    highestScore,
                    false,
                    bestMatch.getId(),
                    bestMatch.getQuestion(),
                    tailoredReply.split("\\s+").length * 2,
                    elapsed,
                    getProviderName()
            );
        }

        // 7. Fallback: below confidence threshold (Human Escalation)
        String fallback = req.getFallbackMessage() != null && !req.getFallbackMessage().isBlank()
                ? req.getFallbackMessage()
                : "I apologize, but I don't have that specific information right now. Let me connect you with one of our team members.";

        return new AiGenerationResponse(
                fallback,
                highestScore,
                true,
                null,
                null,
                fallback.split("\\s+").length * 2,
                elapsed,
                getProviderName()
        );
    }

    private boolean isAppointmentIntent(String text) {
        return text.contains("book") || text.contains("appointment") || text.contains("slot")
                || text.contains("schedule") || text.contains("reserve")
                || (text.contains("available") && (text.contains("time") || text.contains("tomorrow") || text.contains("today")));
    }

    private AiGenerationResponse handleAppointmentIntent(AiGenerationRequest req, String text, long startTime) {
        LocalDate targetDate = LocalDate.now().plusDays(1);
        if (text.contains("today")) {
            targetDate = LocalDate.now();
        } else if (text.contains("tomorrow")) {
            targetDate = LocalDate.now().plusDays(1);
        }

        // Find service match
        ServiceItem targetService = null;
        if (req.getServices() != null) {
            for (ServiceItem s : req.getServices()) {
                if (text.contains(s.getName().toLowerCase())) {
                    targetService = s;
                    break;
                }
            }
            if (targetService == null && !req.getServices().isEmpty()) {
                targetService = req.getServices().get(0);
            }
        }

        // Find staff match
        Staff targetStaff = null;
        if (req.getStaffMembers() != null) {
            for (Staff st : req.getStaffMembers()) {
                if (text.contains(st.getName().toLowerCase())) {
                    targetStaff = st;
                    break;
                }
            }
        }

        UUID serviceId = targetService != null ? targetService.getId() : null;
        UUID staffId = targetStaff != null ? targetStaff.getId() : null;

        List<TimeSlotDto> slots = appointmentService.getAvailableSlots(req.getBusinessId(), null, serviceId, staffId, targetDate);

        // Check if user requested an explicit time (e.g. "10:00", "11:30", "10am", "2pm")
        String extractedTime = extractRequestedTime(text);
        if (extractedTime != null && !slots.isEmpty()) {
            TimeSlotDto matchedSlot = slots.stream()
                    .filter(s -> s.getTimeFormatted() != null && s.getTimeFormatted().startsWith(extractedTime))
                    .findFirst()
                    .orElse(null);

            if (matchedSlot != null) {
                // Execute Safe Action: Autonomous Appointment Booking
                CreateAppointmentRequest createReq = new CreateAppointmentRequest();
                createReq.setCustomerName(req.getCustomerName() != null ? req.getCustomerName() : "WhatsApp Customer");
                createReq.setCustomerPhone(req.getCustomerPhoneNumber() != null ? req.getCustomerPhoneNumber() : "+919876543210");
                createReq.setServiceId(serviceId);
                createReq.setServiceName(targetService != null ? targetService.getName() : "General Consultation");
                if (matchedSlot.getAvailableStaff() != null && !matchedSlot.getAvailableStaff().isEmpty()) {
                    createReq.setStaffId(matchedSlot.getAvailableStaff().get(0).getStaffId());
                    createReq.setStaffName(matchedSlot.getAvailableStaff().get(0).getStaffName());
                } else if (targetStaff != null) {
                    createReq.setStaffId(targetStaff.getId());
                    createReq.setStaffName(targetStaff.getName());
                }
                createReq.setStartTime(matchedSlot.getStartTime());
                createReq.setEndTime(matchedSlot.getEndTime());
                createReq.setBookingSource("WHATSAPP_AI");
                createReq.setNotes("Booked autonomously via SmartReply AI assistant");

                AppointmentDto booked = appointmentService.createAppointment(req.getBusinessId(), createReq);
                long elapsed = System.currentTimeMillis() - startTime;

                String reply = String.format("""
                        🎉 Your appointment has been successfully confirmed!
                        • Service: %s
                        • Specialist: %s
                        • Date & Time: %s (%s)
                        • Location: %s
                        We look forward to seeing you! Reply CANCEL at any time to reschedule.
                        """,
                        booked.getServiceName(),
                        booked.getStaffName() != null ? booked.getStaffName() : "Assigned Specialist",
                        targetDate,
                        matchedSlot.getTimeFormatted(),
                        req.getBusinessName()
                ).trim();

                return new AiGenerationResponse(reply, 0.98, false, null, "Appointment Booked", 35, elapsed, getProviderName());
            }
        }

        // Return Available Slots list
        long elapsed = System.currentTimeMillis() - startTime;
        if (slots.isEmpty()) {
            String noSlotReply = "We currently have no open slots available for "
                    + (targetService != null ? targetService.getName() : "consultations")
                    + " on " + targetDate + " due to fully booked schedules or off-shift hours. Would you like to check the following day?";
            return new AiGenerationResponse(noSlotReply, 0.92, false, null, "Slots Unavailable", 25, elapsed, getProviderName());
        }

        String serviceTitle = targetService != null ? targetService.getName() : "appointments";
        StringBuilder slotReply = new StringBuilder("Here are the available slots for " + serviceTitle + " on " + targetDate + ":\n");
        int count = 0;
        for (TimeSlotDto slot : slots) {
            slotReply.append("• ").append(slot.getTimeFormatted()).append("\n");
            if (++count >= 4) break;
        }
        slotReply.append("\nPlease reply with your preferred time to confirm your booking!");

        return new AiGenerationResponse(slotReply.toString().trim(), 0.95, false, null, "Available Slots", 30, elapsed, getProviderName());
    }

    private String extractRequestedTime(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d{1,2}):(\\d{2})\\b");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            String hour = matcher.group(1);
            String min = matcher.group(2);
            if (hour.length() == 1) hour = "0" + hour;
            return hour + ":" + min;
        }

        Pattern amPmPattern = Pattern.compile("\\b(\\d{1,2})\\s*(am|pm)\\b");
        Matcher amPmMatcher = amPmPattern.matcher(text);
        if (amPmMatcher.find()) {
            int h = Integer.parseInt(amPmMatcher.group(1));
            String mer = amPmMatcher.group(2);
            if ("pm".equalsIgnoreCase(mer) && h < 12) h += 12;
            if ("am".equalsIgnoreCase(mer) && h == 12) h = 0;
            return String.format("%02d:00", h);
        }

        return null;
    }

    private boolean isServiceInquiryIntent(String text) {
        return text.contains("service") || text.contains("treatment") || text.contains("price")
                || text.contains("pricing") || text.contains("cost") || text.contains("rate")
                || text.contains("menu") || text.contains("offer") || text.contains("how much")
                || text.contains("haircut") || text.contains("facial") || text.contains("cleaning")
                || text.contains("root canal");
    }

    private AiGenerationResponse handleServiceInquiry(AiGenerationRequest req, String text, long startTime) {
        long elapsed = System.currentTimeMillis() - startTime;

        // Check if single specific service matched
        for (ServiceItem s : req.getServices()) {
            if (text.contains(s.getName().toLowerCase())) {
                String reply = String.format("%s at %s takes approximately %d mins and is priced at ₹%.2f. Would you like to check open slots to book this treatment?",
                        s.getName(), req.getBusinessName(), s.getDurationMinutes(), s.getPrice());
                return new AiGenerationResponse(reply, 0.95, false, null, "Service Pricing Inquiry", 30, elapsed, getProviderName());
            }
        }

        // List active services
        StringBuilder sb = new StringBuilder("Here are the services & treatments available at " + req.getBusinessName() + ":\n");
        for (ServiceItem s : req.getServices()) {
            sb.append(String.format("• %s (%d mins - ₹%.0f)\n", s.getName(), s.getDurationMinutes(), s.getPrice()));
        }
        sb.append("\nWould you like to book an appointment for any of these?");

        return new AiGenerationResponse(sb.toString().trim(), 0.95, false, null, "Service Catalog Inquiry", 35, elapsed, getProviderName());
    }

    private boolean isStaffInquiryIntent(String text) {
        return text.contains("doctor") || text.contains("stylist") || text.contains("specialist")
                || text.contains("dentist") || text.contains("practitioner") || text.contains("who is available")
                || text.contains("team") || text.contains("staff");
    }

    private AiGenerationResponse handleStaffInquiry(AiGenerationRequest req, long startTime) {
        long elapsed = System.currentTimeMillis() - startTime;
        StringBuilder sb = new StringBuilder("Our team of practitioners at " + req.getBusinessName() + " includes:\n");
        for (Staff st : req.getStaffMembers()) {
            sb.append(String.format("• %s (%s)\n", st.getName(), st.getStaffType()));
        }
        sb.append("\nWould you like to schedule an appointment with one of our specialists?");

        return new AiGenerationResponse(sb.toString().trim(), 0.95, false, null, "Staff Inquiry", 30, elapsed, getProviderName());
    }

    private boolean isOperatingHoursIntent(String text) {
        return text.contains("timing") || text.contains("hours") || text.contains("open")
                || text.contains("close") || text.contains("sunday") || text.contains("working hours")
                || text.contains("schedule");
    }

    private boolean isGreeting(String text) {
        if (text == null || text.isBlank()) return false;
        String clean = text.replaceAll("[^a-zA-Z0-9 ]", " ").replaceAll("\\s+", " ").trim();
        Set<String> greetings = Set.of("hi", "hello", "hey", "good morning", "good evening", "good afternoon", "namaste", "hola");
        if (greetings.contains(clean)) return true;
        for (String g : greetings) {
            if (clean.equals(g) || clean.startsWith(g + " ") || clean.endsWith(" " + g) || clean.contains(" " + g + " ")) {
                return true;
            }
        }
        return false;
    }

    private double calculateMatchScore(String query, KnowledgeArticle article) {
        String qClean = query.replaceAll("[^a-zA-Z0-9 ]", "").toLowerCase();
        String questionClean = article.getQuestion().replaceAll("[^a-zA-Z0-9 ]", "").toLowerCase();

        // Exact match
        if (questionClean.equals(qClean)) return 0.99;
        if (questionClean.contains(qClean) || qClean.contains(questionClean)) return 0.92;

        Set<String> queryWords = new HashSet<>(Arrays.asList(qClean.split("\\s+")));
        Set<String> questionWords = new HashSet<>(Arrays.asList(questionClean.split("\\s+")));

        // Common stopwords removal
        Set<String> stopwords = Set.of("what", "is", "are", "your", "the", "how", "do", "i", "can", "to", "for", "in", "a", "an", "please");
        queryWords.removeAll(stopwords);
        questionWords.removeAll(stopwords);

        if (queryWords.isEmpty() || questionWords.isEmpty()) return 0.0;

        int matches = 0;
        for (String qw : queryWords) {
            if (questionWords.contains(qw)) {
                matches++;
            }
        }

        double wordOverlapScore = (double) matches / Math.min(queryWords.size(), questionWords.size());

        // Check keywords
        double keywordScore = 0.0;
        if (article.getKeywords() != null && !article.getKeywords().isBlank()) {
            String[] kwList = article.getKeywords().toLowerCase().split(",");
            for (String kw : kwList) {
                String cleanKw = kw.trim();
                if (!cleanKw.isEmpty() && qClean.contains(cleanKw)) {
                    keywordScore += 0.25;
                }
            }
        }

        double totalScore = Math.min(0.95, wordOverlapScore * 0.7 + keywordScore);
        return Math.round(totalScore * 100.0) / 100.0;
    }

    private String formatWithTone(String answer, String tone) {
        if (tone == null) tone = "PROFESSIONAL";
        return switch (tone.toUpperCase()) {
            case "FRIENDLY" -> answer + " Feel free to let us know if you have any questions!";
            case "EMPATHETIC" -> "We understand and are here to help. " + answer;
            case "CONCISE" -> answer.trim();
            default -> answer; // PROFESSIONAL
        };
    }
}
