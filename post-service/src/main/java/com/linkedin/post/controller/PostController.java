package com.linkedin.post.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final List<Map<String, Object>> posts = new ArrayList<>();

    public PostController() {
        // Seed sample post
        Map<String, Object> p1 = new HashMap<>();
        p1.put("id", "post_8901");
        p1.put("authorId", "user_101");
        p1.put("authorName", "Alice Chen");
        p1.put("content", "Excited to share that we just migrated our core feeds to a Kafka Fan-Out architecture with Redis caching! 🚀 #systemdesign #kafka #redis #springboot");
        p1.put("createdAt", System.currentTimeMillis() - 3600000);
        p1.put("likesCount", 142);
        p1.put("commentsCount", 18);
        posts.add(p1);
    }

    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Map<String, Object> body) {
        String postId = "post_" + (System.currentTimeMillis() % 100000);
        body.put("id", postId);
        body.put("createdAt", System.currentTimeMillis());
        body.put("likesCount", 0);
        body.put("commentsCount", 0);

        posts.add(0, body); // Prepend to latest

        // Simulate Kafka event publication
        Map<String, Object> kafkaEvent = Map.of(
            "eventType", "POST_CREATED",
            "postId", postId,
            "authorId", body.getOrDefault("authorId", "user_101"),
            "timestamp", System.currentTimeMillis(),
            "kafkaTopic", "post-created"
        );

        return ResponseEntity.ok(Map.of(
            "status", "SUCCESS",
            "post", body,
            "kafkaEventPublished", kafkaEvent,
            "message", "Post created & published to Kafka 'post-created' topic for fan-out processing."
        ));
    }

    @GetMapping
    public ResponseEntity<?> getAllPosts() {
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(@PathVariable String id) {
        return posts.stream()
            .filter(p -> p.get("id").equals(id))
            .findFirst()
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
