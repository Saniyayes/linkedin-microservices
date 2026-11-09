package com.linkedin.user.controller;

import com.linkedin.user.model.Certification;
import com.linkedin.user.model.Education;
import com.linkedin.user.model.Experience;
import com.linkedin.user.model.User;
import com.linkedin.user.repository.UserRepository;
import com.linkedin.user.model.PasswordResetToken;
import com.linkedin.user.repository.PasswordResetTokenRepository;
import com.linkedin.user.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

    @org.springframework.beans.factory.annotation.Value("${oauth.google.client-id:}")
    private String googleClientId;

    @org.springframework.beans.factory.annotation.Value("${oauth.linkedin.client-id:}")
    private String linkedinClientId;

    @org.springframework.beans.factory.annotation.Value("${oauth.linkedin.client-secret:}")
    private String linkedinClientSecret;

    @org.springframework.beans.factory.annotation.Value("${resend.api-key:}")
    private String resendApiKey;

    @org.springframework.beans.factory.annotation.Value("${resend.from-email:onboarding@resend.dev}")
    private String resendFromEmail;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:https://nodework-frontend.onrender.com}")
    private String frontendUrl;

    public UserController(UserRepository userRepository,
                          PasswordResetTokenRepository passwordResetTokenRepository,
                          JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.jwtUtil = jwtUtil;
    }

    private int calculateProfileCompletion(User user) {
        int score = 20; // base for registration
        if (user.getHeadline() != null && !user.getHeadline().isBlank()) score += 15;
        if (user.getAbout() != null && !user.getAbout().isBlank()) score += 15;
        if (user.getLocation() != null && !user.getLocation().isBlank()) score += 10;
        if (user.getSkills() != null && !user.getSkills().isEmpty()) score += 15;
        if (user.getExperiences() != null && !user.getExperiences().isEmpty()) score += 15;
        if (user.getEducations() != null && !user.getEducations().isEmpty()) score += 10;
        return Math.min(100, score);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, Object> req) {
        String email = (String) req.get("email");
        String rawPassword = (String) req.get("password");
        String name = (String) req.get("name");

        if (email == null || rawPassword == null || name == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "name, email and password are required"));
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
        }

        User user = new User();
        user.setEmail(email.trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setName(name.trim());
        user.setTitle(req.get("title") != null ? (String) req.get("title") : "Professional Member");
        user.setHeadline(req.get("headline") != null ? (String) req.get("headline") : user.getTitle());
        user.setCompany((String) req.get("company"));
        user.setCollege((String) req.get("college"));
        user.setLocation(req.get("location") != null ? (String) req.get("location") : "Global");
        user.setAbout((String) req.get("about"));
        user.setAvatarUrl((String) req.get("avatarUrl"));
        user.setCoverUrl((String) req.get("coverUrl"));

        if (req.get("skills") instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> skills = (List<String>) req.get("skills");
            user.setSkills(skills);
        }

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(Map.of(
                "message", "User registered successfully",
                "userId", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "token", token
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String rawPassword = req.get("password");

        return userRepository.findByEmailIgnoreCase(email)
                .filter(u -> rawPassword != null && passwordEncoder.matches(rawPassword, u.getPasswordHash()))
                .map(u -> ResponseEntity.ok(Map.of(
                        "message", "Authentication successful",
                        "token", jwtUtil.generateToken(u.getId(), u.getEmail()),
                        "userId", u.getId(),
                        "name", u.getName(),
                        "email", u.getEmail(),
                        "headline", u.getHeadline() != null ? u.getHeadline() : "",
                        "avatarUrl", u.getAvatarUrl() != null ? u.getAvatarUrl() : ""
                )))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password")));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing or invalid token"));
        }
        String token = authHeader.substring(7);
        try {
            Long userId = jwtUtil.getUserIdFromToken(token);
            return userRepository.findById(userId)
                    .map(u -> {
                        Map<String, Object> resp = new HashMap<>();
                        resp.put("user", u);
                        resp.put("completionPercentage", calculateProfileCompletion(u));
                        return ResponseEntity.ok(resp);
                    })
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token expired or invalid"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    Map<String, Object> resp = new HashMap<>();
                    resp.put("id", user.getId());
                    resp.put("name", user.getName());
                    resp.put("email", user.getEmail());
                    resp.put("title", user.getTitle());
                    resp.put("headline", user.getHeadline());
                    resp.put("company", user.getCompany());
                    resp.put("college", user.getCollege());
                    resp.put("location", user.getLocation());
                    resp.put("about", user.getAbout());
                    resp.put("website", user.getWebsite());
                    resp.put("phone", user.getPhone());
                    resp.put("avatarUrl", user.getAvatarUrl());
                    resp.put("coverUrl", user.getCoverUrl());
                    resp.put("skills", user.getSkills());
                    resp.put("experiences", user.getExperiences());
                    resp.put("educations", user.getEducations());
                    resp.put("certifications", user.getCertifications());
                    resp.put("connectionsCount", user.getConnectionsCount());
                    resp.put("followersCount", user.getFollowersCount());
                    resp.put("completionPercentage", calculateProfileCompletion(user));
                    return ResponseEntity.ok(resp);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        return userRepository.findById(id).map(user -> {
            if (updates.containsKey("name")) user.setName((String) updates.get("name"));
            if (updates.containsKey("title")) user.setTitle((String) updates.get("title"));
            if (updates.containsKey("headline")) user.setHeadline((String) updates.get("headline"));
            if (updates.containsKey("company")) user.setCompany((String) updates.get("company"));
            if (updates.containsKey("college")) user.setCollege((String) updates.get("college"));
            if (updates.containsKey("location")) user.setLocation((String) updates.get("location"));
            if (updates.containsKey("about")) user.setAbout((String) updates.get("about"));
            if (updates.containsKey("website")) user.setWebsite((String) updates.get("website"));
            if (updates.containsKey("phone")) user.setPhone((String) updates.get("phone"));
            if (updates.containsKey("avatarUrl")) user.setAvatarUrl((String) updates.get("avatarUrl"));
            if (updates.containsKey("coverUrl")) user.setCoverUrl((String) updates.get("coverUrl"));

            if (updates.get("skills") instanceof List) {
                @SuppressWarnings("unchecked")
                List<String> skills = (List<String>) updates.get("skills");
                user.setSkills(skills);
            }

            User saved = userRepository.save(user);
            return ResponseEntity.ok(saved);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Experiences
    @PostMapping("/{id}/experience")
    public ResponseEntity<?> addExperience(@PathVariable Long id, @RequestBody Experience exp) {
        return userRepository.findById(id).map(user -> {
            if (exp.getId() == null || exp.getId().isBlank()) {
                exp.setId(UUID.randomUUID().toString());
            }
            user.getExperiences().add(exp);
            userRepository.save(user);
            return ResponseEntity.ok(user.getExperiences());
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/experience/{expId}")
    public ResponseEntity<?> deleteExperience(@PathVariable Long id, @PathVariable String expId) {
        return userRepository.findById(id).map(user -> {
            user.getExperiences().removeIf(e -> Objects.equals(e.getId(), expId));
            userRepository.save(user);
            return ResponseEntity.ok(user.getExperiences());
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Education
    @PostMapping("/{id}/education")
    public ResponseEntity<?> addEducation(@PathVariable Long id, @RequestBody Education edu) {
        return userRepository.findById(id).map(user -> {
            if (edu.getId() == null || edu.getId().isBlank()) {
                edu.setId(UUID.randomUUID().toString());
            }
            user.getEducations().add(edu);
            userRepository.save(user);
            return ResponseEntity.ok(user.getEducations());
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/education/{eduId}")
    public ResponseEntity<?> deleteEducation(@PathVariable Long id, @PathVariable String eduId) {
        return userRepository.findById(id).map(user -> {
            user.getEducations().removeIf(e -> Objects.equals(e.getId(), eduId));
            userRepository.save(user);
            return ResponseEntity.ok(user.getEducations());
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Certification
    @PostMapping("/{id}/certification")
    public ResponseEntity<?> addCertification(@PathVariable Long id, @RequestBody Certification cert) {
        return userRepository.findById(id).map(user -> {
            if (cert.getId() == null || cert.getId().isBlank()) {
                cert.setId(UUID.randomUUID().toString());
            }
            user.getCertifications().add(cert);
            userRepository.save(user);
            return ResponseEntity.ok(user.getCertifications());
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/certification/{certId}")
    public ResponseEntity<?> deleteCertification(@PathVariable Long id, @PathVariable String certId) {
        return userRepository.findById(id).map(user -> {
            user.getCertifications().removeIf(c -> Objects.equals(c.getId(), certId));
            userRepository.save(user);
            return ResponseEntity.ok(user.getCertifications());
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Search and discovery
    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam(required = false, defaultValue = "") String q) {
        if (q.trim().isEmpty()) {
            return ResponseEntity.ok(userRepository.findAll());
        }
        return ResponseEntity.ok(userRepository.searchUsers(q.trim()));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<?> getSuggestions(@RequestParam(required = false) Long currentUserId) {
        List<User> all = userRepository.findAll();
        List<User> suggestions = new ArrayList<>();
        for (User u : all) {
            if (currentUserId == null || !u.getId().equals(currentUserId)) {
                suggestions.add(u);
            }
        }
        return ResponseEntity.ok(suggestions);
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // OAuth: Google & LinkedIn
    // ─────────────────────────────────────────────────────────────────────────────

    @PostMapping("/oauth/google")
    public ResponseEntity<?> googleAuth(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");
        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "idToken is required"));
        }

        try {
            String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            Map<?, ?> tokenInfo = restTemplate.getForObject(tokenInfoUrl, Map.class);
            if (tokenInfo == null || !"true".equals(String.valueOf(tokenInfo.get("email_verified")))) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Google email is not verified or token is invalid"));
            }

            String email = (String) tokenInfo.get("email");
            String name = tokenInfo.get("name") != null ? String.valueOf(tokenInfo.get("name")) : "Google User";
            String picture = (String) tokenInfo.get("picture");

            User user = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email.toLowerCase().trim());
                newUser.setName(name);
                newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
                newUser.setTitle("Professional Member");
                newUser.setHeadline("Professional Member");
                newUser.setLocation("Global");
                newUser.setAvatarUrl(picture);
                return userRepository.save(newUser);
            });

            String token = jwtUtil.generateToken(user.getId(), user.getEmail());
            return ResponseEntity.ok(Map.of(
                "token", token,
                "userId", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "headline", user.getHeadline() != null ? user.getHeadline() : "",
                "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Failed to verify Google token: " + e.getMessage()));
        }
    }

    @PostMapping("/oauth/linkedin")
    public ResponseEntity<?> linkedinAuth(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String redirectUri = body.get("redirectUri");
        if (code == null || redirectUri == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "code and redirectUri are required"));
        }

        if (linkedinClientId == null || linkedinClientId.isBlank() || linkedinClientSecret == null || linkedinClientSecret.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "LinkedIn OAuth is not configured on the server. Please set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET."
            ));
        }

        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);

            org.springframework.util.MultiValueMap<String, String> map = new org.springframework.util.LinkedMultiValueMap<>();
            map.add("grant_type", "authorization_code");
            map.add("code", code);
            map.add("redirect_uri", redirectUri);
            map.add("client_id", linkedinClientId);
            map.add("client_secret", linkedinClientSecret);

            org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, String>> request =
                new org.springframework.http.HttpEntity<>(map, headers);

            Map<?, ?> tokenResponse = restTemplate.postForObject("https://www.linkedin.com/oauth/v2/accessToken", request, Map.class);
            if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Failed to obtain LinkedIn access token"));
            }

            String accessToken = (String) tokenResponse.get("access_token");

            org.springframework.http.HttpHeaders userHeaders = new org.springframework.http.HttpHeaders();
            userHeaders.setBearerAuth(accessToken);
            org.springframework.http.HttpEntity<?> userRequest = new org.springframework.http.HttpEntity<>(userHeaders);

            Map<?, ?> userInfo = restTemplate.exchange("https://api.linkedin.com/v2/userinfo", org.springframework.http.HttpMethod.GET, userRequest, Map.class).getBody();
            if (userInfo == null || !userInfo.containsKey("email")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Failed to retrieve LinkedIn user profile"));
            }

            String email = (String) userInfo.get("email");
            String name = userInfo.get("name") != null ? String.valueOf(userInfo.get("name")) : "LinkedIn Member";
            String picture = (String) userInfo.get("picture");

            User user = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email.toLowerCase().trim());
                newUser.setName(name);
                newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
                newUser.setTitle("Professional Member");
                newUser.setHeadline("Professional Member");
                newUser.setLocation("Global");
                newUser.setAvatarUrl(picture);
                return userRepository.save(newUser);
            });

            String token = jwtUtil.generateToken(user.getId(), user.getEmail());
            return ResponseEntity.ok(Map.of(
                "token", token,
                "userId", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "headline", user.getHeadline() != null ? user.getHeadline() : "",
                "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "LinkedIn authentication failed: " + e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Password Reset
    // ─────────────────────────────────────────────────────────────────────────────

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email != null && !email.isBlank()) {
            userRepository.findByEmailIgnoreCase(email.trim()).ifPresent(user -> {
                String token = UUID.randomUUID().toString();
                long expiry = System.currentTimeMillis() + (15 * 60 * 1000); // 15 mins
                PasswordResetToken resetToken = new PasswordResetToken(token, user.getEmail(), expiry);
                passwordResetTokenRepository.save(resetToken);

                if (resendApiKey != null && !resendApiKey.isBlank()) {
                    try {
                        String resetLink = frontendUrl + "/reset-password?token=" + token;
                        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                        headers.setBearerAuth(resendApiKey);
                        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

                        Map<String, Object> emailPayload = Map.of(
                            "from", resendFromEmail,
                            "to", List.of(user.getEmail()),
                            "subject", "Reset your NodeWork password",
                            "html", "<p>Hello " + user.getName() + ",</p><p>You requested a password reset for your NodeWork account. Click the link below to set a new password:</p><p><a href=\"" + resetLink + "\" style=\"background-color:#0a66c2;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;\">Reset Password</a></p><p>This link will expire in 15 minutes. If you did not request this, you can safely ignore this email.</p>"
                        );

                        org.springframework.http.HttpEntity<Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(emailPayload, headers);
                        restTemplate.postForEntity("https://api.resend.com/emails", entity, Map.class);
                    } catch (Exception ignored) {}
                }
            });
        }

        return ResponseEntity.ok(Map.of(
            "message", "If that email address is registered, password reset instructions have been sent."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");

        if (token == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Valid reset token and new password (min 6 chars) are required"));
        }

        Optional<PasswordResetToken> opt = passwordResetTokenRepository.findByTokenAndUsedFalse(token);
        if (opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or already used password reset link"));
        }

        PasswordResetToken resetToken = opt.get();
        if (resetToken.getExpiryTime() < System.currentTimeMillis()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password reset link has expired"));
        }

        return userRepository.findByEmailIgnoreCase(resetToken.getEmail()).map(user -> {
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            resetToken.setUsed(true);
            passwordResetTokenRepository.save(resetToken);

            return ResponseEntity.ok(Map.of("message", "Password has been successfully reset. You may now sign in."));
        }).orElseGet(() -> ResponseEntity.badRequest().body(Map.of("error", "User associated with token not found")));
    }
}
