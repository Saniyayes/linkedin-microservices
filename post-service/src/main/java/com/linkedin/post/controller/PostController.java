package com.linkedin.post.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.linkedin.post.model.Post;
import com.linkedin.post.repository.PostRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostRepository postRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PostController(PostRepository postRepository, KafkaTemplate<String, String> kafkaTemplate) {
        this.postRepository = postRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Map<String, Object> body) {
        if (body.get("content") == null || body.get("authorId") == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "authorId and content are required"));
        }

        Post post = new Post();
        post.setAuthorId(String.valueOf(body.get("authorId")));
        post.setAuthorName((String) body.getOrDefault("authorName", "Unknown"));
        post.setContent((String) body.get("content"));
        post.setCreatedAt(System.currentTimeMillis());
        post = postRepository.save(post);

        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "POST_CREATED");
            event.put("postId", post.getId());
            event.put("authorId", post.getAuthorId());
            event.put("authorName", post.getAuthorName());
            event.put("content", post.getContent());
            event.put("createdAt", post.getCreatedAt());
            kafkaTemplate.send("post-created", String.valueOf(post.getId()), objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            System.err.println("Failed to publish post-created event: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Post created successfully",
                "post", post,
                "kafkaEventPublished", true
        ));
    }

    @GetMapping
    public ResponseEntity<?> getAllPosts() {
        return ResponseEntity.ok(postRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(@PathVariable Long id) {
        return postRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
