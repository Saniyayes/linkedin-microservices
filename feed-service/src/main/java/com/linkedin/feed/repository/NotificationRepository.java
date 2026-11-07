package com.linkedin.feed.repository;

import com.linkedin.feed.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);
    int countByRecipientIdAndIsReadFalse(String recipientId);
}
