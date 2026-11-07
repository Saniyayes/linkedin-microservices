package com.linkedin.user.controller;

import com.linkedin.user.model.Certification;
import com.linkedin.user.model.Education;
import com.linkedin.user.model.Experience;
import com.linkedin.user.model.User;
import com.linkedin.user.repository.UserRepository;
import com.linkedin.user.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserController(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
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
}
