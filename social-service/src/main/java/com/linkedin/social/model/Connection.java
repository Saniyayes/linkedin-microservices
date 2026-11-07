package com.linkedin.social.model;

import jakarta.persistence.*;

@Entity
@Table(name = "connections", indexes = {
    @Index(name = "idx_requester", columnList = "requesterId"),
    @Index(name = "idx_receiver", columnList = "receiverId")
})
public class Connection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String requesterId;

    @Column(nullable = false)
    private String receiverId;

    private String requesterName;
    private String receiverName;

    @Column(nullable = false)
    private String status; // PENDING, ACCEPTED, REJECTED

    private long createdAt;

    public Connection() {}

    public Connection(String requesterId, String receiverId, String requesterName, String receiverName, String status) {
        this.requesterId = requesterId;
        this.receiverId = receiverId;
        this.requesterName = requesterName;
        this.receiverName = receiverName;
        this.status = status;
        this.createdAt = System.currentTimeMillis();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRequesterId() { return requesterId; }
    public void setRequesterId(String requesterId) { this.requesterId = requesterId; }
    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }
    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }
    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
