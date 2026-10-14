package com.smartreplyai.conversation;

import com.smartreplyai.ai.AiService;
import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.conversation.dto.ConversationDto;
import com.smartreplyai.conversation.dto.SendMessageRequest;
import com.smartreplyai.message.Message;
import com.smartreplyai.message.dto.MessageDto;
import com.smartreplyai.security.UserPrincipal;
import com.smartreplyai.tenant.TenantContext;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;
    private final AiService aiService;

    public ConversationController(ConversationService conversationService, AiService aiService) {
        this.conversationService = conversationService;
        this.aiService = aiService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ConversationDto>>> getConversations(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "30") int size) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        Page<Conversation> convs = conversationService.getConversations(
                businessId, status, query, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "lastMessageAt")));
        return ResponseEntity.ok(ApiResponse.ok(convs.map(ConversationDto::fromEntity)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversationDto>> getConversationById(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        Conversation c = conversationService.getConversationById(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok(ConversationDto.fromEntity(c)));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<List<MessageDto>>> getMessages(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        List<Message> messages = conversationService.getMessages(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok(messages.stream().map(MessageDto::fromEntity).toList()));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<MessageDto>> sendAgentReply(
            @PathVariable("id") UUID id,
            @Valid @RequestBody SendMessageRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        Message msg = conversationService.sendAgentMessage(businessId, id, req.getTextContent(), principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Message sent", MessageDto.fromEntity(msg)));
    }

    @PostMapping("/simulate-incoming")
    public ResponseEntity<ApiResponse<MessageDto>> simulateIncomingCustomerMessage(
            @RequestBody Map<String, Object> body) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        UUID customerId = UUID.fromString((String) body.get("customerId"));
        String text = (String) body.get("textContent");

        Message msg = conversationService.handleCustomerMessage(businessId, customerId, text, "SIMULATED_" + System.currentTimeMillis());
        return ResponseEntity.ok(ApiResponse.ok("Incoming message processed", MessageDto.fromEntity(msg)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ConversationDto>> updateStatus(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, String> body) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        String status = body.get("status");
        Conversation c = conversationService.updateStatus(businessId, id, status);
        return ResponseEntity.ok(ApiResponse.ok("Status updated", ConversationDto.fromEntity(c)));
    }

    @PatchMapping("/{id}/ai-toggle")
    public ResponseEntity<ApiResponse<ConversationDto>> toggleAi(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        Conversation c = conversationService.toggleAi(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok("AI response mode toggled", ConversationDto.fromEntity(c)));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<ConversationDto>> assignAgent(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, String> body) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        String agentIdStr = body.get("agentUserId");
        UUID agentId = agentIdStr != null && !agentIdStr.isBlank() ? UUID.fromString(agentIdStr) : null;

        Conversation c = conversationService.assignAgent(businessId, id, agentId);
        return ResponseEntity.ok(ApiResponse.ok("Agent assignment updated", ConversationDto.fromEntity(c)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        conversationService.markAsRead(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok("Marked as read", null));
    }

    @GetMapping("/{id}/suggestions")
    public ResponseEntity<ApiResponse<List<String>>> getSuggestions(
            @PathVariable("id") UUID id,
            @RequestParam(name = "lastMessage", required = false) String lastMessage) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        Conversation c = conversationService.getConversationById(businessId, id);
        String msg = (lastMessage != null && !lastMessage.isBlank()) ? lastMessage : c.getLastMessageSnippet();
        List<String> suggestions = aiService.generateSuggestedReplies(businessId, msg != null ? msg : "");
        return ResponseEntity.ok(ApiResponse.ok(suggestions));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        conversationService.deleteConversation(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok("Conversation deleted successfully", null));
    }
}
