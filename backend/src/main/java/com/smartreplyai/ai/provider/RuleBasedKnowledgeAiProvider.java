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

        // 1. Handle common greetings and /start command gracefully
        if (isGreeting(customerText)) {
            String greeting = buildGreeting(req);
            long elapsed = System.currentTimeMillis() - startTime;
            return new AiGenerationResponse(greeting, 0.98, false, null, "Greeting", 25, elapsed, getProviderName());
        }

        // 2. Handle Acknowledgements, Thanks, and conversational closing
        if (isAcknowledgementIntent(customerText)) {
            String ack = "You're very welcome! If you need more information or wish to book an appointment at "
                    + (req.getBusinessName() != null ? req.getBusinessName() : "our clinic")
                    + ", feel free to message anytime. Have a wonderful day!";
            long elapsed = System.currentTimeMillis() - startTime;
            return new AiGenerationResponse(ack, 0.98, false, null, "Acknowledgement", 25, elapsed, getProviderName());
        }

        // 3. Emergency & Acute Pain Grounding
        if (isEmergencyIntent(customerText)) {
            String reply = "If you are experiencing severe pain, acute swelling, or a medical/dental emergency, our clinic prioritizes same-day relief visits! Please come to "
                    + (req.getBusinessName() != null ? req.getBusinessName() : "our clinic")
                    + " right away or ask me to check today's emergency appointment slots.";
            long elapsed = System.currentTimeMillis() - startTime;
            return new AiGenerationResponse(reply, 0.98, false, null, "Emergency Assistance", 30, elapsed, getProviderName());
        }

        // 4. Appointment Availability & Safe Booking Intent Engine
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

        // 5. Service Catalog & Pricing Grounding
        if (isServiceInquiryIntent(customerText) && req.getServices() != null && !req.getServices().isEmpty()) {
            AiGenerationResponse serviceResp = handleServiceInquiry(req, customerText, startTime);
            if (serviceResp != null) {
                return serviceResp;
            }
        }

        // 6. Staff / Specialists Grounding
        if (isStaffInquiryIntent(customerText) && req.getStaffMembers() != null && !req.getStaffMembers().isEmpty()) {
            AiGenerationResponse staffResp = handleStaffInquiry(req, startTime);
            if (staffResp != null) {
                return staffResp;
            }
        }

        // 7. Operating Hours Grounding (Only if hours are configured on the business)
        if (isOperatingHoursIntent(customerText) && req.getOperatingHours() != null && !req.getOperatingHours().isBlank()) {
            String hoursReply = "Our operating hours at " + req.getBusinessName() + " are: " + req.getOperatingHours()
                    + ". Would you like to schedule a visit or consultation?";
            long elapsed = System.currentTimeMillis() - startTime;
            return new AiGenerationResponse(hoursReply, 0.95, false, null, "Operating Hours", 30, elapsed, getProviderName());
        }

        // 8. Location & Address Grounding
        if (isLocationIntent(customerText)) {
            String addr = (req.getBusinessAddress() != null && !req.getBusinessAddress().isBlank())
                    ? req.getBusinessAddress()
                    : "our main clinic branch";
            String reply = req.getBusinessName() + " is located at: " + addr
                    + ". You can visit us during operating hours or book an appointment right here on chat. Would you like to check open slots?";
            long elapsed = System.currentTimeMillis() - startTime;
            return new AiGenerationResponse(reply, 0.95, false, null, "Location and Address", 30, elapsed, getProviderName());
        }

        // 9. Organization & Business Identity Grounding
        if (isOrganizationIntent(customerText) && req.getBusinessName() != null && !req.getBusinessName().isBlank()) {
            StringBuilder sb = new StringBuilder("We are " + req.getBusinessName());
            if (req.getBusinessCategory() != null && !req.getBusinessCategory().isBlank()) {
                sb.append(" (").append(req.getBusinessCategory()).append(")");
            }
            sb.append(". ");
            if (req.getBusinessDescription() != null && !req.getBusinessDescription().isBlank()) {
                sb.append(req.getBusinessDescription()).append(" ");
            }
            sb.append("I am your automated AI assistant here to assist you with treatments, pricing, timings, and booking doctor appointments.");
            long elapsed = System.currentTimeMillis() - startTime;
            return new AiGenerationResponse(sb.toString().trim(), 0.95, false, null, "Business Organization Overview", 30, elapsed, getProviderName());
        }

        // 10. Assistant Capabilities & "Which information you give" Grounding
        if (isCapabilityIntent(customerText)) {
            StringBuilder sb = new StringBuilder("At " + req.getBusinessName() + ", I can help you with:\n");
            sb.append("• Treatments & Services — pricing, duration & procedures\n");
            sb.append("• Specialists & Doctors — availability and profiles\n");
            sb.append("• Operating Hours — clinic working hours and timings\n");
            sb.append("• Appointments — checking available slots and booking\n");
            sb.append("\nYou can ask me questions like 'What are your dental cleaning charges?' or 'Are you open tomorrow?'");
            long elapsed = System.currentTimeMillis() - startTime;
            return new AiGenerationResponse(sb.toString().trim(), 0.95, false, null, "Assistant Capabilities", 35, elapsed, getProviderName());
        }

        // 11. Contact & Management Inquiry Grounding
        if (isContactIntent(customerText)) {
            StringBuilder sb = new StringBuilder("You can reach " + req.getBusinessName() + " right here on this chat! ");
            if (req.getBusinessPhone() != null && !req.getBusinessPhone().isBlank()) {
                sb.append("Direct phone: ").append(req.getBusinessPhone()).append(". ");
            }
            if (req.getStaffMembers() != null && !req.getStaffMembers().isEmpty()) {
                sb.append("Our clinical team is led by ").append(req.getStaffMembers().get(0).getName()).append(". ");
            }
            sb.append("If you need direct assistance from our management, a team member will follow up with you. You can also message your query or book a visit directly.");
            long elapsed = System.currentTimeMillis() - startTime;
            return new AiGenerationResponse(sb.toString().trim(), 0.95, false, null, "Contact Information", 30, elapsed, getProviderName());
        }

        // 12. Small Talk & Identity Grounding
        if (isSmallTalkOrIdentityIntent(customerText)) {
            String reply = "I am the AI assistant for " + req.getBusinessName()
                    + "! I am here 24/7 to help you with treatment details, doctor availability, clinic timings, and scheduling appointments. How can I assist you today?";
            long elapsed = System.currentTimeMillis() - startTime;
            return new AiGenerationResponse(reply, 0.98, false, null, "AI Assistant Small Talk", 30, elapsed, getProviderName());
        }

        // 9. Knowledge Base (FAQ) Article Match
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

        // 7. Fallback: if it's the customer's first message, welcome them gracefully instead of escalating
        if (req.isFirstMessage()) {
            String welcome = buildGreeting(req);
            return new AiGenerationResponse(
                    welcome,
                    0.95,
                    false,
                    null,
                    "Greeting",
                    welcome.split("\\s+").length * 2,
                    elapsed,
                    getProviderName()
            );
        }

        // Otherwise escalate to human agent
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
        LocalDate targetDate = LocalDate.now();
        if (text.contains("tomorrow")) {
            targetDate = LocalDate.now().plusDays(1);
        } else if (text.contains("today")) {
            targetDate = LocalDate.now();
        } else if (targetDate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            targetDate = targetDate.plusDays(1); // Default to Monday if today is Sunday
        }

        // If target date is Sunday, advance to Monday
        if (targetDate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY && !text.contains("today")) {
            targetDate = targetDate.plusDays(1);
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

        // If slots are exhausted for targetDate (e.g. clinic closed or end of day), look ahead to next working day
        if (slots.isEmpty() && !text.contains("today")) {
            LocalDate nextDay = targetDate.plusDays(targetDate.getDayOfWeek() == java.time.DayOfWeek.SATURDAY ? 2 : 1);
            List<TimeSlotDto> nextSlots = appointmentService.getAvailableSlots(req.getBusinessId(), null, serviceId, staffId, nextDay);
            if (!nextSlots.isEmpty()) {
                targetDate = nextDay;
                slots = nextSlots;
            }
        }

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
        if (text == null || text.isBlank()) return false;
        return text.contains("service") || text.contains("treatment") || text.contains("procedure")
                || text.contains("price") || text.contains("pricing") || text.contains("cost")
                || text.contains("rate") || text.contains("charge") || text.contains("fee")
                || text.contains("menu") || text.contains("offer") || text.contains("how much")
                || text.contains("cleaning") || text.contains("scaling") || text.contains("polishing")
                || text.contains("whitening") || text.contains("root canal") || text.contains("filling")
                || text.contains("extraction") || text.contains("x-ray") || text.contains("xray")
                || text.contains("implant") || text.contains("braces") || text.contains("consultation");
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

    private boolean isOrganizationIntent(String text) {
        if (text == null || text.isBlank()) return false;
        return text.contains("organisation") || text.contains("organization") || text.contains("business name")
                || text.contains("clinic name") || text.contains("company name") || text.contains("who are you")
                || text.contains("what is your name") || text.contains("what clinic") || text.contains("about your business")
                || text.contains("about you") || text.contains("unga peru") || text.contains("enga irukku");
    }

    private boolean isCapabilityIntent(String text) {
        if (text == null || text.isBlank()) return false;
        return text.contains("which information") || text.contains("what information") || text.contains("information you give")
                || text.contains("information you provide") || text.contains("what can you do") || text.contains("what do you do")
                || text.contains("how can you help") || text.contains("what can i ask") || text.contains("how does this work")
                || text.contains("features") || text.contains("help me") || text.contains("enna panna mudiyum") || text.contains("guide me");
    }

    private boolean isContactIntent(String text) {
        if (text == null || text.isBlank()) return false;
        return text.contains("owner number") || text.contains("doctor number") || text.contains("phone number")
                || text.contains("contact number") || text.contains("mobile number") || text.contains("owner phone")
                || text.contains("owner") || text.contains("how to contact") || text.contains("call you")
                || text.contains("contact details");
    }

    private boolean isOperatingHoursIntent(String text) {
        return text.contains("timing") || text.contains("hours") || text.contains("open")
                || text.contains("close") || text.contains("sunday") || text.contains("working hours")
                || text.contains("schedule");
    }

    private boolean isAcknowledgementIntent(String text) {
        if (text == null || text.isBlank()) return false;
        String clean = text.replaceAll("[^a-zA-Z0-9 ]", " ").replaceAll("\\s+", " ").trim().toLowerCase();
        Set<String> acks = Set.of(
                "ok", "okay", "okie", "k", "kk", "thanks", "thank you", "thank u", "tq",
                "sure", "cool", "got it", "fine", "alright", "great", "nice", "done",
                "bye", "goodbye", "see you", "take care", "understood", "super", "perfect", "seri", "nandri"
        );
        if (acks.contains(clean)) return true;
        for (String a : acks) {
            if (clean.equals(a) || clean.startsWith(a + " ") || clean.endsWith(" " + a)) {
                return true;
            }
        }
        return false;
    }

    private boolean isEmergencyIntent(String text) {
        if (text == null || text.isBlank()) return false;
        return text.contains("emergency") || text.contains("severe pain") || text.contains("toothache")
                || text.contains("tooth ache") || text.contains("tooth pain") || text.contains("bleeding")
                || text.contains("swelling") || text.contains("urgent") || text.contains("vali")
                || (text.contains("pain") && !text.contains("painless"));
    }

    private boolean isLocationIntent(String text) {
        if (text == null || text.isBlank()) return false;
        return text.contains("location") || text.contains("address") || text.contains("where are you")
                || text.contains("where is") || text.contains("directions") || text.contains("how to reach")
                || text.contains("map") || text.contains("place") || text.contains("enga irukku");
    }

    private boolean isSmallTalkOrIdentityIntent(String text) {
        if (text == null || text.isBlank()) return false;
        return (text.contains("you") && (text.contains("ai") || text.contains("bot") || text.contains("human") || text.contains("real") || text.contains("robot")))
                || text.contains("how are you") || text.contains("who made you") || text.contains("ai assistant")
                || text.contains("chatbot") || text.contains("robot") || text.contains("who are u")
                || text.contains("what is your name");
    }

    private boolean isGreeting(String text) {
        if (text == null || text.isBlank()) return false;
        String raw = text.trim().toLowerCase();
        if (raw.equals("/start") || raw.startsWith("/start ") || raw.equals("/help") || raw.startsWith("/help ")) {
            return true;
        }
        if (raw.equals("start") || raw.equals("help")) {
            return true;
        }
        if (raw.contains("வணக்கம்") || raw.contains("vanakkam")) {
            return true;
        }
        String clean = text.replaceAll("[^a-zA-Z0-9 ]", " ").replaceAll("\\s+", " ").trim().toLowerCase();
        Set<String> greetings = Set.of(
                "hi", "hello", "hey", "start", "help", "good morning", "good evening", "good afternoon",
                "good day", "namaste", "vanakkam", "hola", "hi there", "hello there", "hey there", "greetings"
        );
        if (greetings.contains(clean)) return true;
        for (String g : greetings) {
            if (clean.equals(g) || clean.startsWith(g + " ") || clean.endsWith(" " + g) || clean.contains(" " + g + " ")) {
                return true;
            }
        }
        return false;
    }

    private String buildGreeting(AiGenerationRequest req) {
        String customerSalutation = "";
        if (req.getCustomerName() != null && !req.getCustomerName().isBlank()
                && !"Telegram User".equalsIgnoreCase(req.getCustomerName().trim())) {
            customerSalutation = " " + req.getCustomerName().trim();
        }

        if (req.getGreetingMessage() != null && !req.getGreetingMessage().isBlank()) {
            String custom = req.getGreetingMessage().trim();
            if (!customerSalutation.isEmpty() && custom.toLowerCase().startsWith("hello!")) {
                return "Hello" + customerSalutation + "!" + custom.substring("hello!".length());
            }
            return custom;
        }

        String bizName = (req.getBusinessName() != null && !req.getBusinessName().isBlank())
                ? req.getBusinessName().trim()
                : "our business";

        if (req.getAssistantName() != null && !req.getAssistantName().isBlank()) {
            return "Hello" + customerSalutation + "! I am " + req.getAssistantName().trim()
                    + ", automated assistant for " + bizName
                    + ". How may I assist you today? Feel free to ask about our services, pricing, working hours, or book an appointment!";
        }

        return "Hello" + customerSalutation + "! Welcome to " + bizName
                + ". How can I help you today? You can inquire about our services, timings, or book an appointment.";
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
