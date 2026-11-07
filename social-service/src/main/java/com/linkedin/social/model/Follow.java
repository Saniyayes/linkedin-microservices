package com.linkedin.social.model;

import jakarta.persistence.*;

@Entity
@Table(name = "follows", indexes = {
    @Index(name = "idx_follower", columnList = "followerId"),
    @Index(name = "idx_followed", columnList = "followedId")
})
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String followerId;

    @Column(nullable = false)
    private String followedId;

    private String followerName;
    private String followedName;

    private long createdAt;

    public Follow() {}

    public Follow(String followerId, String followedId, String followerName, String followedName) {
        this.followerId = followerId;
        this.followedId = followedId;
        this.followerName = followerName;
        this.followedName = followedName;
        this.createdAt = System.currentTimeMillis();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFollowerId() { return followerId; }
    public void setFollowerId(String followerId) { this.followerId = followerId; }
    public String getFollowedId() { return followedId; }
    public void setFollowedId(String followedId) { this.followedId = followedId; }
    public String getFollowerName() { return followerName; }
    public void setFollowerName(String followerName) { this.followerName = followerName; }
    public String getFollowedName() { return followedName; }
    public void setFollowedName(String followedName) { this.followedName = followedName; }
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
