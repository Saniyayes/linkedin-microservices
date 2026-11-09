package com.linkedin.user.model;

import jakarta.persistence.*;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private long expiryTime;

    private boolean used = false;

    public PasswordResetToken() {}

    public PasswordResetToken(String token, String email, long expiryTime) {
        this.token = token;
        this.email = email;
        this.expiryTime = expiryTime;
        this.used = false;
    }

    public Long getId() { return id; }
    public String getToken() { return token; }
    public String getEmail() { return email; }
    public long getExpiryTime() { return expiryTime; }
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
}
