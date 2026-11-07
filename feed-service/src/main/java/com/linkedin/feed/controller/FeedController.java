package com.linkedin.feed.controller;

import com.linkedin.feed.model.ChatMessage;
import com.linkedin.feed.model.Conversation;
import com.linkedin.feed.model.Notification;
import com.linkedin.feed.repository.ChatMessageRepository;
import com.linkedin.feed.repository.ConversationRepository;
import com.linkedin.feed.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
public class FeedController {

    private final NotificationRepository notificationRepository;
    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${post-service.url:http://localhost:8083}")
    private String postServiceUrl;

    public FeedController(NotificationRepository notificationRepository,
                          ConversationRepository conversationRepository,
                          ChatMessageRepository chatMessageRepository) {
        this.notificationRepository = notificationRepository;
        this.conversationRepository = conversationRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Feed
    // ─────────────────────────────────────────────────────────────────────────────

    @GetMapping("/api/feed")
    public ResponseEntity<?> getFeed(@RequestParam(defaultValue = "user_102") String userId) {
        long startTime = System.nanoTime();
        List<?> posts = Collections.emptyList();
        try {
            // Forward to post-service to retrieve recent posts
            posts = restTemplate.getForObject(postServiceUrl + "/api/posts?userId=" + userId, List.class);
        } catch (Exception e) {
            // Return empty list if post-service unavailable
            posts = Collections.emptyList();
        }

        double latencyMs = (System.nanoTime() - startTime) / 1_000_000.0;
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "feedCount", posts != null ? posts.size() : 0,
            "posts", posts != null ? posts : Collections.emptyList(),
            "queryPerformance", Map.of(
                "latencyMs", latencyMs,
                "architecturePattern", "Fan-Out Microservices Architecture"
            )
        ));
    }

    @PostMapping("/api/feed/simulate-fanout")
    public ResponseEntity<?> simulateFanoutEvent(@RequestBody Map<String, Object> event) {
        String authorId = (String) event.getOrDefault("authorId", "user_101");
        String postId = (String) event.getOrDefault("postId", "post_new_" + System.currentTimeMillis() % 1000);
        String content = (String) event.getOrDefault("content", "Published a new technical post!");

        return ResponseEntity.ok(Map.of(
            "status", "FANOUT_COMPLETED",
            "authorId", authorId,
            "postId", postId,
            "content", content,
            "timestamp", System.currentTimeMillis()
        ));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Notifications
    // ─────────────────────────────────────────────────────────────────────────────

    @GetMapping("/api/feed/notifications/{userId}")
    public ResponseEntity<?> getNotifications(@PathVariable String userId) {
        return ResponseEntity.ok(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId));
    }

    @GetMapping("/api/feed/notifications/unread-count/{userId}")
    public ResponseEntity<?> getUnreadNotificationCount(@PathVariable String userId) {
        int count = notificationRepository.countByRecipientIdAndIsReadFalse(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PostMapping("/api/feed/notifications")
    public ResponseEntity<?> createNotification(@RequestBody Map<String, String> body) {
        String recipientId = body.get("recipientId");
        String actorId = body.get("actorId");
        String actorName = body.getOrDefault("actorName", "Member");
        String actorAvatar = body.getOrDefault("actorAvatar", "");
        String type = body.getOrDefault("type", "GENERAL");
        String title = body.getOrDefault("title", "New Notification");
        String message = body.getOrDefault("message", "");
        String referenceId = body.getOrDefault("referenceId", "");

        Notification n = new Notification(recipientId, actorId, actorName, actorAvatar, type, title, message, referenceId);
        return ResponseEntity.ok(notificationRepository.save(n));
    }

    @PutMapping("/api/feed/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        return notificationRepository.findById(id).map(n -> {
            n.setRead(true);
            return ResponseEntity.ok(notificationRepository.save(n));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Transactional
    @PutMapping("/api/feed/notifications/read-all/{userId}")
    public ResponseEntity<?> markAllNotificationsRead(@PathVariable String userId) {
        List<Notification> list = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        for (Notification n : list) {
            n.setRead(true);
        }
        notificationRepository.saveAll(list);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Chat & Messaging
    // ─────────────────────────────────────────────────────────────────────────────

    @GetMapping("/api/chat/conversations/{userId}")
    public ResponseEntity<?> getConversations(@PathVariable String userId) {
        return ResponseEntity.ok(conversationRepository.findUserConversations(userId));
    }

    @PostMapping("/api/chat/conversations")
    public ResponseEntity<?> getOrCreateConversation(@RequestBody Map<String, String> body) {
        String u1 = body.get("user1Id");
        String u2 = body.get("user2Id");
        String u1Name = body.getOrDefault("user1Name", "Member");
        String u2Name = body.getOrDefault("user2Name", "Member");
        String u1Avatar = body.getOrDefault("user1Avatar", "");
        String u2Avatar = body.getOrDefault("user2Avatar", "");

        Optional<Conversation> existing = conversationRepository.findBetweenUsers(u1, u2);
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }

        Conversation c = new Conversation();
        c.setUser1Id(u1);
        c.setUser2Id(u2);
        c.setUser1Name(u1Name);
        c.setUser2Name(u2Name);
        c.setUser1Avatar(u1Avatar);
        c.setUser2Avatar(u2Avatar);
        c.setLastMessage("Conversation started");
        c.setLastMessageTime(System.currentTimeMillis());
        c.setUpdatedAt(System.currentTimeMillis());

        return ResponseEntity.ok(conversationRepository.save(c));
    }

    @GetMapping("/api/chat/messages/{conversationId}")
    public ResponseEntity<?> getMessages(@PathVariable Long conversationId) {
        return ResponseEntity.ok(chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId));
    }

    @PostMapping("/api/chat/messages")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> body) {
        Long conversationId = Long.valueOf(String.valueOf(body.get("conversationId")));
        String senderId = String.valueOf(body.get("senderId"));
        String senderName = (String) body.getOrDefault("senderName", "Member");
        String senderAvatar = (String) body.getOrDefault("senderAvatar", "");
        String receiverId = String.valueOf(body.get("receiverId"));
        String content = (String) body.get("content");

        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message content cannot be blank"));
        }

        ChatMessage msg = new ChatMessage(conversationId, senderId, senderName, senderAvatar, receiverId, content.trim());
        msg = chatMessageRepository.save(msg);

        // Update conversation last message
        conversationRepository.findById(conversationId).ifPresent(c -> {
            c.setLastMessage(content.trim());
            c.setLastMessageTime(System.currentTimeMillis());
            c.setUpdatedAt(System.currentTimeMillis());
            if (c.getUser1Id().equals(receiverId)) {
                c.setUser1UnreadCount(c.getUser1UnreadCount() + 1);
            } else {
                c.setUser2UnreadCount(c.getUser2UnreadCount() + 1);
            }
            conversationRepository.save(c);
        });

        // Create a notification for the receiver
        Notification notif = new Notification(
            receiverId,
            senderId,
            senderName,
            senderAvatar,
            "MESSAGE",
            "New message from " + senderName,
            content.trim(),
            String.valueOf(conversationId)
        );
        notificationRepository.save(notif);

        return ResponseEntity.ok(msg);
    }

    @Transactional
    @PutMapping("/api/chat/messages/read/{conversationId}/{userId}")
    public ResponseEntity<?> markMessagesRead(@PathVariable Long conversationId, @PathVariable String userId) {
        List<ChatMessage> msgs = chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        for (ChatMessage m : msgs) {
            if (m.getReceiverId().equals(userId)) {
                m.setRead(true);
            }
        }
        chatMessageRepository.saveAll(msgs);

        conversationRepository.findById(conversationId).ifPresent(c -> {
            if (c.getUser1Id().equals(userId)) {
                c.setUser1UnreadCount(0);
            } else {
                c.setUser2UnreadCount(0);
            }
            conversationRepository.save(c);
        });

        return ResponseEntity.ok(Map.of("status", "READ"));
    }
}
