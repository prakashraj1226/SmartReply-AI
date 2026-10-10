package com.smartreplyai.notification;

import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               BusinessRepository businessRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public NotificationDto createNotification(UUID businessId, UUID userId, String title, String message, String type, String linkUrl) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        Notification n = new Notification(business, user, title, message, type, linkUrl);
        n = notificationRepository.save(n);
        return NotificationDto.fromEntity(n);
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getNotifications(UUID businessId, Pageable pageable) {
        return notificationRepository.findByBusinessIdOrderByCreatedAtDesc(businessId, pageable)
                .map(NotificationDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID businessId) {
        return notificationRepository.countByBusinessIdAndIsReadFalse(businessId);
    }

    @Transactional
    public void markAsRead(UUID businessId, UUID notificationId) {
        Notification n = notificationRepository.findByBusinessIdAndId(businessId, notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead(UUID businessId) {
        notificationRepository.markAllAsRead(businessId);
    }
}
