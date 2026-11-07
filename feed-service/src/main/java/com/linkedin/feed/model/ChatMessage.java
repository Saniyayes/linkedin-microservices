package com.linkedin.feed.model;

import jakarta.persistence.*;

@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_conv_id", columnList = "conversationId")
})
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long conversationId;

    @Column(nullable = false)
    private String senderId;

    private String senderName;
    private String senderAvatar;

    @Column(nullable = false)
    private String receiverId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private boolean isRead = false;
    private long createdAt;

    public ChatMessage() {}

    public ChatMessage(Long conversationId, String senderId, String senderName, String senderAvatar, String receiverId, String content) {
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderAvatar = senderAvatar;
        this.receiverId = receiverId;
        this.content = content;
        this.isRead = false;
        this.createdAt = System.currentTimeMillis();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getSenderAvatar() { return senderAvatar; }
    public void setSenderAvatar(String senderAvatar) { this.senderAvatar = senderAvatar; }
    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
