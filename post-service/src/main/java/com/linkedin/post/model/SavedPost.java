package com.linkedin.post.model;

import jakarta.persistence.*;

@Entity
@Table(name = "saved_posts", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"userId", "postId"})
})
public class SavedPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private Long postId;

    private long createdAt;

    public SavedPost() {}

    public SavedPost(String userId, Long postId) {
        this.userId = userId;
        this.postId = postId;
        this.createdAt = System.currentTimeMillis();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
