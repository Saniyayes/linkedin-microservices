package com.linkedin.feed.model;

import jakarta.persistence.*;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_recipient", columnList = "recipientId"),
    @Index(name = "idx_is_read", columnList = "isRead")
})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String recipientId;

    private String actorId;
    private String actorName;
    private String actorAvatar;

    @Column(nullable = false)
    private String type; // CONNECTION_REQUEST, CONNECTION_ACCEPTED, POST_LIKE, POST_COMMENT, MESSAGE

    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    private String referenceId;
    private boolean isRead = false;
    private long createdAt;

    public Notification() {}

    public Notification(String recipientId, String actorId, String actorName, String actorAvatar, String type, String title, String message, String referenceId) {
        this.recipientId = recipientId;
        this.actorId = actorId;
        this.actorName = actorName;
        this.actorAvatar = actorAvatar;
        this.type = type;
        this.title = title;
        this.message = message;
        this.referenceId = referenceId;
        this.isRead = false;
        this.createdAt = System.currentTimeMillis();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public String getActorAvatar() { return actorAvatar; }
    public void setActorAvatar(String actorAvatar) { this.actorAvatar = actorAvatar; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
