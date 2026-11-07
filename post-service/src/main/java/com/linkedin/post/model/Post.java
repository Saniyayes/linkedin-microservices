package com.linkedin.post.model;

import jakarta.persistence.*;

@Entity
@Table(name = "posts", indexes = {
    @Index(name = "idx_author", columnList = "authorId"),
    @Index(name = "idx_created", columnList = "createdAt")
})
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String authorId;

    @Column(nullable = false)
    private String authorName;

    private String authorHeadline;
    private String authorAvatar;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private String imageUrl;
    private String mediaType; // IMAGE, DOCUMENT, CODE

    private int likesCount = 0;
    private int commentsCount = 0;
    private int repostsCount = 0;

    private long createdAt;
    private long updatedAt;

    public Post() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }
    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }
    public String getAuthorHeadline() { return authorHeadline; }
    public void setAuthorHeadline(String authorHeadline) { this.authorHeadline = authorHeadline; }
    public String getAuthorAvatar() { return authorAvatar; }
    public void setAuthorAvatar(String authorAvatar) { this.authorAvatar = authorAvatar; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
    public int getLikesCount() { return likesCount; }
    public void setLikesCount(int likesCount) { this.likesCount = likesCount; }
    public int getCommentsCount() { return commentsCount; }
    public void setCommentsCount(int commentsCount) { this.commentsCount = commentsCount; }
    public int getRepostsCount() { return repostsCount; }
    public void setRepostsCount(int repostsCount) { this.repostsCount = repostsCount; }
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}
