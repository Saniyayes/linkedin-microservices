package com.linkedin.post.model;

import jakarta.persistence.*;

@Entity
@Table(name = "post_comments", indexes = {
    @Index(name = "idx_comment_post", columnList = "postId")
})
public class PostComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long postId;

    @Column(nullable = false)
    private String authorId;

    @Column(nullable = false)
    private String authorName;

    private String authorHeadline;
    private String authorAvatar;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private long createdAt;

    public PostComment() {}

    public PostComment(Long postId, String authorId, String authorName, String authorHeadline, String authorAvatar, String content) {
        this.postId = postId;
        this.authorId = authorId;
        this.authorName = authorName;
        this.authorHeadline = authorHeadline;
        this.authorAvatar = authorAvatar;
        this.content = content;
        this.createdAt = System.currentTimeMillis();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }
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
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
