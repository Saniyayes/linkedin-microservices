package com.linkedin.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    // Dummy user store for instant simulation & endpoint execution
    private final Map<String, Map<String, Object>> mockUsers = new HashMap<>();

    public UserController() {
        // Seed default sample user profile
        Map<String, Object> u1 = new HashMap<>();
        u1.put("id", "user_101");
        u1.put("name", "Alice Chen");
        u1.put("title", "Senior Backend Engineer @ TechCorp");
        u1.put("skills", List.of("Spring Boot", "Kafka", "Redis", "Distributed Systems"));
        u1.put("company", "TechCorp");
        u1.put("college", "Stanford University");
        u1.put("connectionsCount", 482);
        mockUsers.put("user_101", u1);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, Object> req) {
        String id = "user_" + (mockUsers.size() + 101);
        req.put("id", id);
        req.put("connectionsCount", 0);
        mockUsers.put(id, req);
        return ResponseEntity.ok(Map.of(
            "message", "User registered successfully",
            "userId", id,
            "token", "eyJhbGciOiJIUzI1NiJ9.mock_jwt_token_" + id
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        String email = req.getOrDefault("email", "alice@example.com");
        return ResponseEntity.ok(Map.of(
            "message", "Authentication successful",
            "token", "eyJhbGciOiJIUzI1NiJ9.mock_jwt_token_for_" + email,
            "userId", "user_101"
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable String id) {
        Map<String, Object> user = mockUsers.get(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(mockUsers.values());
    }
}
