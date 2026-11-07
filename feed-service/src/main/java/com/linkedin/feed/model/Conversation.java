package com.linkedin.feed.model;

import jakarta.persistence.*;

@Entity
@Table(name = "conversations", indexes = {
    @Index(name = "idx_conv_u1", columnList = "user1Id"),
    @Index(name = "idx_conv_u2", columnList = "user2Id")
})
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String user1Id;

    @Column(nullable = false)
    private String user2Id;

    private String user1Name;
    private String user2Name;
    private String user1Avatar;
    private String user2Avatar;

    @Column(columnDefinition = "TEXT")
    private String lastMessage;

    private long lastMessageTime;
    private int user1UnreadCount = 0;
    private int user2UnreadCount = 0;
    private long updatedAt;

    public Conversation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUser1Id() { return user1Id; }
    public void setUser1Id(String user1Id) { this.user1Id = user1Id; }
    public String getUser2Id() { return user2Id; }
    public void setUser2Id(String user2Id) { this.user2Id = user2Id; }
    public String getUser1Name() { return user1Name; }
    public void setUser1Name(String user1Name) { this.user1Name = user1Name; }
    public String getUser2Name() { return user2Name; }
    public void setUser2Name(String user2Name) { this.user2Name = user2Name; }
    public String getUser1Avatar() { return user1Avatar; }
    public void setUser1Avatar(String user1Avatar) { this.user1Avatar = user1Avatar; }
    public String getUser2Avatar() { return user2Avatar; }
    public void setUser2Avatar(String user2Avatar) { this.user2Avatar = user2Avatar; }
    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }
    public long getLastMessageTime() { return lastMessageTime; }
    public void setLastMessageTime(long lastMessageTime) { this.lastMessageTime = lastMessageTime; }
    public int getUser1UnreadCount() { return user1UnreadCount; }
    public void setUser1UnreadCount(int user1UnreadCount) { this.user1UnreadCount = user1UnreadCount; }
    public int getUser2UnreadCount() { return user2UnreadCount; }
    public void setUser2UnreadCount(int user2UnreadCount) { this.user2UnreadCount = user2UnreadCount; }
    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}
