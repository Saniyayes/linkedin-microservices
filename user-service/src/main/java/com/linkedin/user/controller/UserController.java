package com.linkedin.user.controller;

import com.linkedin.user.model.User;
import com.linkedin.user.repository.UserRepository;
import com.linkedin.user.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setName(name);
        user.setTitle((String) req.get("title"));
        user.setCompany((String) req.get("company"));
        user.setCollege((String) req.get("college"));
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(Map.of(
                "message", "User registered successfully",
                "userId", user.getId(),
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
                        "name", u.getName()
                )))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password")));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        return userRepository.findById(id).map(user -> {
            if (updates.containsKey("title")) user.setTitle((String) updates.get("title"));
            if (updates.containsKey("company")) user.setCompany((String) updates.get("company"));
            if (updates.containsKey("college")) user.setCollege((String) updates.get("college"));
            if (updates.get("skills") instanceof List) {
                @SuppressWarnings("unchecked")
                List<String> skills = (List<String>) updates.get("skills");
                user.setSkills(skills);
            }
            return ResponseEntity.ok(userRepository.save(user));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}
