package com.smartreplyai.conversation;

import com.smartreplyai.ai.AiService;
import com.smartreplyai.ai.dto.AiGenerationResponse;
import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.customer.Customer;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.message.Message;
import com.smartreplyai.message.MessageRepository;
import com.smartreplyai.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartreplyai.whatsapp.IntegrationAccount;
import com.smartreplyai.whatsapp.IntegrationAccountRepository;
import com.smartreplyai.whatsapp.client.OfficialWhatsAppCloudApiClient;
import com.smartreplyai.whatsapp.client.WhatsAppSendResult;
import com.smartreplyai.telegram.client.TelegramClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ConversationService {

    private static final Logger logger = LoggerFactory.getLogger(ConversationService.class);

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final CustomerRepository customerRepository;
    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final AiService aiService;
    private final IntegrationAccountRepository integrationAccountRepository;
    private final OfficialWhatsAppCloudApiClient whatsAppClient;
    private final TelegramClient telegramClient;
    private final com.smartreplyai.subscription.PlanLimitService planLimitService;

    public ConversationService(ConversationRepository conversationRepository,
                               MessageRepository messageRepository,
                               CustomerRepository customerRepository,
                               BusinessRepository businessRepository,
                               UserRepository userRepository,
                               AiService aiService,
                               IntegrationAccountRepository integrationAccountRepository,
                               OfficialWhatsAppCloudApiClient whatsAppClient,
                               TelegramClient telegramClient,
                               com.smartreplyai.subscription.PlanLimitService planLimitService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.customerRepository = customerRepository;
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
        this.aiService = aiService;
        this.integrationAccountRepository = integrationAccountRepository;
        this.whatsAppClient = whatsAppClient;
        this.telegramClient = telegramClient;
        this.planLimitService = planLimitService;
    }

    @Transactional(readOnly = true)
    public Page<Conversation> getConversations(UUID businessId, String status, String query, Pageable pageable) {
        String cleanStatus = (status != null && !status.equalsIgnoreCase("ALL") && !status.isBlank()) ? status.toUpperCase() : null;
        String cleanQuery = (query != null && !query.isBlank()) ? query.trim().toLowerCase() : null;

        if (cleanStatus != null && cleanQuery != null) {
            return conversationRepository.searchByStatusAndQuery(businessId, cleanStatus, "%" + cleanQuery + "%", pageable);
        } else if (cleanStatus != null) {
            return conversationRepository.findByBusinessIdAndStatus(businessId, cleanStatus, pageable);
        } else if (cleanQuery != null) {
            return conversationRepository.searchByQuery(businessId, "%" + cleanQuery + "%", pageable);
        } else {
            return conversationRepository.findByBusinessId(businessId, pageable);
        }
    }

    @Transactional(readOnly = true)
    public Conversation getConversationById(UUID businessId, UUID conversationId) {
        return conversationRepository.findByBusinessIdAndId(businessId, conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
    }

    @Transactional(readOnly = true)
    public List<Message> getMessages(UUID businessId, UUID conversationId) {
        // Verify conversation belongs to tenant
        getConversationById(businessId, conversationId);
        return messageRepository.findByBusinessIdAndConversationIdOrderByCreatedAtAsc(businessId, conversationId);
    }

    @Transactional
    public Message sendAgentMessage(UUID businessId, UUID conversationId, String textContent, UserPrincipal agentPrincipal) {
        Conversation conversation = getConversationById(businessId, conversationId);
        Business business = conversation.getBusiness();

        Message message = new Message();
        message.setConversation(conversation);
        message.setBusiness(business);
        message.setSenderType("AGENT");
        message.setTextContent(textContent.trim());
        message.setDeliveryStatus("SENT");
        message = messageRepository.save(message);

        conversation.setLastMessageSnippet(textContent.trim());
        conversation.setLastMessageAt(Instant.now());
        conversation.setUnreadCount(0);
        conversationRepository.save(conversation);

        // Outbound dispatch to Telegram or WhatsApp based on customer channel
        if (conversation.getCustomer() != null && conversation.getCustomer().getPhoneNumber() != null) {
            String phone = conversation.getCustomer().getPhoneNumber();
            if (phone.startsWith("tg:")) {
                String chatId = phone.substring(3);
                integrationAccountRepository.findByBusinessIdAndProvider(businessId, "TELEGRAM_BOT")
                        .ifPresent(account -> {
                            try {
                                telegramClient.sendMessage(account, chatId, textContent.trim());
                            } catch (Exception e) {
                                logger.error("Failed to dispatch Telegram outbound message", e);
                            }
                        });
            } else {
                integrationAccountRepository.findByBusinessIdAndProvider(businessId, "WHATSAPP_CLOUD")
                        .ifPresent(account -> {
                            try {
                                WhatsAppSendResult result = whatsAppClient.sendTextMessage(account, conversation.getCustomer().getPhoneNumber(), textContent.trim());
                                if (result.isSuccess()) {
                                    logger.info("Outbound WhatsApp agent message dispatched to {}: id={}, simulated={}",
                                            conversation.getCustomer().getPhoneNumber(), result.getMessageId(), result.isSimulated());
                                } else {
                                    logger.warn("Outbound WhatsApp message failed: {}", result.getErrorMessage());
                                }
                            } catch (Exception e) {
                                logger.error("Failed to dispatch WhatsApp outbound message", e);
                            }
                        });
            }
        }

        return message;
    }

    @Transactional
    public Message handleCustomerMessage(UUID businessId, UUID customerId, String textContent, String externalMessageId) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
        Customer customer = customerRepository.findByBusinessIdAndId(businessId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        boolean isNewConversation = conversationRepository.findByBusinessIdAndCustomerId(businessId, customerId).isEmpty();

        Conversation conversation = conversationRepository.findByBusinessIdAndCustomerId(businessId, customerId)
                .orElseGet(() -> {
                    planLimitService.checkConversationLimit(businessId);
                    Conversation c = new Conversation(business, customer);
                    if (customer.getPhoneNumber() != null && customer.getPhoneNumber().startsWith("tg:")) {
                        c.setChannel("TELEGRAM");
                    }
                    return conversationRepository.save(c);
                });

        if (customer.getPhoneNumber() != null && customer.getPhoneNumber().startsWith("tg:")
                && !"TELEGRAM".equalsIgnoreCase(conversation.getChannel())) {
            conversation.setChannel("TELEGRAM");
        }

        boolean isFirstMessage = isNewConversation || messageRepository.countByBusinessIdAndConversationId(businessId, conversation.getId()) == 0;

        // 1. Persist Customer Message
        Message incomingMessage = new Message();
        incomingMessage.setConversation(conversation);
        incomingMessage.setBusiness(business);
        incomingMessage.setSenderType("CUSTOMER");
        incomingMessage.setTextContent(textContent.trim());
        incomingMessage.setExternalMessageId(externalMessageId);
        incomingMessage.setDeliveryStatus("READ");
        incomingMessage = messageRepository.save(incomingMessage);

        conversation.setLastMessageSnippet(textContent.trim());
        conversation.setLastMessageAt(Instant.now());
        conversation.setStatus("OPEN");
        conversation.setUnreadCount(conversation.getUnreadCount() + 1);

        // 2. Trigger AI Autonomous Response if AI is enabled and not blocked by plan/trial expiration
        if (conversation.isAiEnabled() && planLimitService.canSendWhatsAppAutoReply(businessId)) {
            AiGenerationResponse aiResponse = aiService.processIncomingMessage(
                    businessId, textContent, List.of(), customer.getPhoneNumber(), customer.getName(), isFirstMessage
            );

            if (aiResponse != null && aiResponse.getReplyText() != null) {
                Message aiMessage = new Message();
                aiMessage.setConversation(conversation);
                aiMessage.setBusiness(business);
                aiMessage.setSenderType("AI");
                aiMessage.setTextContent(aiResponse.getReplyText());
                aiMessage.setDeliveryStatus("SENT");
                messageRepository.save(aiMessage);

                conversation.setLastMessageSnippet(aiResponse.getReplyText());
                conversation.setLastMessageAt(Instant.now());

                if (aiResponse.isEscalated()) {
                    conversation.setStatus("PENDING"); // Human attention needed!
                } else {
                    conversation.setUnreadCount(0); // Answered cleanly
                }

                // Dispatch AI autonomous reply to Telegram or WhatsApp based on customer channel
                if (customer.getPhoneNumber() != null) {
                    if (customer.getPhoneNumber().startsWith("tg:")) {
                        String chatId = customer.getPhoneNumber().substring(3);
                        integrationAccountRepository.findByBusinessIdAndProvider(businessId, "TELEGRAM_BOT")
                                .ifPresent(account -> {
                                    try {
                                        telegramClient.sendMessage(account, chatId, aiResponse.getReplyText());
                                    } catch (Exception e) {
                                        logger.error("Failed to dispatch Telegram AI reply", e);
                                    }
                                });
                    } else {
                        integrationAccountRepository.findByBusinessIdAndProvider(businessId, "WHATSAPP_CLOUD")
                                .ifPresent(account -> {
                                    try {
                                        whatsAppClient.sendTextMessage(account, customer.getPhoneNumber(), aiResponse.getReplyText());
                                    } catch (Exception e) {
                                        logger.error("Failed to dispatch WhatsApp AI reply", e);
                                    }
                                });
                    }
                }
            }
        }

        conversationRepository.save(conversation);
        return incomingMessage;
    }

    @Transactional
    public Conversation updateStatus(UUID businessId, UUID conversationId, String newStatus) {
        Conversation conversation = getConversationById(businessId, conversationId);
        conversation.setStatus(newStatus.toUpperCase());
        return conversationRepository.save(conversation);
    }

    @Transactional
    public Conversation toggleAi(UUID businessId, UUID conversationId) {
        Conversation conversation = getConversationById(businessId, conversationId);
        conversation.setAiEnabled(!conversation.isAiEnabled());
        return conversationRepository.save(conversation);
    }

    @Transactional
    public Conversation assignAgent(UUID businessId, UUID conversationId, UUID agentUserId) {
        Conversation conversation = getConversationById(businessId, conversationId);
        if (agentUserId != null) {
            User agent = userRepository.findById(agentUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("Agent user not found"));
            conversation.setAssignedAgent(agent);
        } else {
            conversation.setAssignedAgent(null);
        }
        return conversationRepository.save(conversation);
    }

    @Transactional
    public void markAsRead(UUID businessId, UUID conversationId) {
        Conversation conversation = getConversationById(businessId, conversationId);
        conversation.setUnreadCount(0);
        conversationRepository.save(conversation);
    }

    @Transactional
    public void deleteConversation(UUID businessId, UUID conversationId) {
        Conversation conversation = getConversationById(businessId, conversationId);
        messageRepository.deleteByBusinessIdAndConversationId(businessId, conversationId);
        conversationRepository.delete(conversation);
        logger.info("Deleted conversation {} and messages for business {}", conversationId, businessId);
    }
}
