package com.linkedin.feed.repository;

import com.linkedin.feed.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
    int countByConversationIdAndReceiverIdAndIsReadFalse(Long conversationId, String receiverId);
}
