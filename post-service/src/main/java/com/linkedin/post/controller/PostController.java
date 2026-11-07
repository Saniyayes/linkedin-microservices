package com.linkedin.post.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.linkedin.post.model.*;
import com.linkedin.post.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final SavedPostRepository savedPostRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final SavedJobRepository savedJobRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PostController(PostRepository postRepository,
                          PostLikeRepository postLikeRepository,
                          PostCommentRepository postCommentRepository,
                          SavedPostRepository savedPostRepository,
                          JobRepository jobRepository,
                          JobApplicationRepository jobApplicationRepository,
                          SavedJobRepository savedJobRepository,
                          KafkaTemplate<String, String> kafkaTemplate) {
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.postCommentRepository = postCommentRepository;
        this.savedPostRepository = savedPostRepository;
        this.jobRepository = jobRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.savedJobRepository = savedJobRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Posts CRUD
    // ─────────────────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Map<String, Object> body) {
        if (body.get("content") == null || body.get("authorId") == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "authorId and content are required"));
        }

        Post post = new Post();
        post.setAuthorId(String.valueOf(body.get("authorId")));
        post.setAuthorName((String) body.getOrDefault("authorName", "Professional Member"));
        post.setAuthorHeadline((String) body.getOrDefault("authorHeadline", ""));
        post.setAuthorAvatar((String) body.getOrDefault("authorAvatar", ""));
        post.setContent((String) body.get("content"));
        post.setImageUrl((String) body.get("imageUrl"));
        post.setMediaType((String) body.getOrDefault("mediaType", "TEXT"));
        post.setCreatedAt(System.currentTimeMillis());
        post.setUpdatedAt(System.currentTimeMillis());
        post = postRepository.save(post);

        // Emit Kafka event if Kafka is available
        try {
            if (kafkaTemplate != null) {
                Map<String, Object> event = new HashMap<>();
                event.put("eventType", "POST_CREATED");
                event.put("postId", post.getId());
                event.put("authorId", post.getAuthorId());
                event.put("authorName", post.getAuthorName());
                event.put("content", post.getContent());
                event.put("createdAt", post.getCreatedAt());
                kafkaTemplate.send("post-created", String.valueOf(post.getId()), objectMapper.writeValueAsString(event));
            }
        } catch (Exception ignored) {}

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Post published successfully",
                "post", post
        ));
    }

    @GetMapping
    public ResponseEntity<?> getAllPosts(@RequestParam(required = false) String userId) {
        List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> enriched = enrichPosts(posts, userId);
        return ResponseEntity.ok(enriched);
    }

    @GetMapping("/author/{authorId}")
    public ResponseEntity<?> getPostsByAuthor(@PathVariable String authorId, @RequestParam(required = false) String userId) {
        List<Post> posts = postRepository.findByAuthorIdOrderByCreatedAtDesc(authorId);
        List<Map<String, Object>> enriched = enrichPosts(posts, userId);
        return ResponseEntity.ok(enriched);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(@PathVariable Long id, @RequestParam(required = false) String userId) {
        return postRepository.findById(id).map(post -> {
            Map<String, Object> map = new HashMap<>();
            map.put("post", post);
            map.put("comments", postCommentRepository.findByPostIdOrderByCreatedAtAsc(id));
            if (userId != null) {
                map.put("likedByMe", postLikeRepository.findByPostIdAndUserId(id, userId).isPresent());
                map.put("savedByMe", savedPostRepository.findByUserIdAndPostId(userId, id).isPresent());
            }
            return ResponseEntity.ok(map);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return postRepository.findById(id).map(post -> {
            if (body.containsKey("content")) post.setContent((String) body.get("content"));
            if (body.containsKey("imageUrl")) post.setImageUrl((String) body.get("imageUrl"));
            post.setUpdatedAt(System.currentTimeMillis());
            return ResponseEntity.ok(postRepository.save(post));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        if (postRepository.existsById(id)) {
            postRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Post deleted"));
        }
        return ResponseEntity.notFound().build();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Likes & Reactions
    // ─────────────────────────────────────────────────────────────────────────────

    @Transactional
    @PostMapping("/{id}/like")
    public ResponseEntity<?> toggleLike(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        String userName = body.getOrDefault("userName", "Member");
        String userAvatar = body.getOrDefault("userAvatar", "");

        return postRepository.findById(id).map(post -> {
            Optional<PostLike> existing = postLikeRepository.findByPostIdAndUserId(id, userId);
            boolean liked;
            if (existing.isPresent()) {
                postLikeRepository.deleteByPostIdAndUserId(id, userId);
                post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
                liked = false;
            } else {
                PostLike like = new PostLike(id, userId, userName, userAvatar);
                postLikeRepository.save(like);
                post.setLikesCount(post.getLikesCount() + 1);
                liked = true;
            }
            postRepository.save(post);
            return ResponseEntity.ok(Map.of(
                "postId", id,
                "liked", liked,
                "likesCount", post.getLikesCount()
            ));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/likes")
    public ResponseEntity<?> getPostLikes(@PathVariable Long id) {
        return ResponseEntity.ok(postLikeRepository.findByPostId(id));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Comments
    // ─────────────────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String authorId = body.get("authorId");
        String authorName = body.getOrDefault("authorName", "Member");
        String authorHeadline = body.getOrDefault("authorHeadline", "");
        String authorAvatar = body.getOrDefault("authorAvatar", "");
        String content = body.get("content");

        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Comment content is required"));
        }

        return postRepository.findById(id).map(post -> {
            PostComment comment = new PostComment(id, authorId, authorName, authorHeadline, authorAvatar, content.trim());
            comment = postCommentRepository.save(comment);
            post.setCommentsCount(post.getCommentsCount() + 1);
            postRepository.save(post);
            return ResponseEntity.ok(comment);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(postCommentRepository.findByPostIdOrderByCreatedAtAsc(id));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Saved / Bookmarked Posts
    // ─────────────────────────────────────────────────────────────────────────────

    @Transactional
    @PostMapping("/{id}/save")
    public ResponseEntity<?> toggleSavePost(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        Optional<SavedPost> existing = savedPostRepository.findByUserIdAndPostId(userId, id);
        boolean saved;
        if (existing.isPresent()) {
            savedPostRepository.deleteByUserIdAndPostId(userId, id);
            saved = false;
        } else {
            savedPostRepository.save(new SavedPost(userId, id));
            saved = true;
        }
        return ResponseEntity.ok(Map.of("postId", id, "saved", saved));
    }

    @GetMapping("/saved/{userId}")
    public ResponseEntity<?> getSavedPosts(@PathVariable String userId) {
        List<SavedPost> saved = savedPostRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (SavedPost sp : saved) {
            postRepository.findById(sp.getPostId()).ifPresent(p -> {
                Map<String, Object> map = new HashMap<>();
                map.put("post", p);
                map.put("savedAt", sp.getCreatedAt());
                result.add(map);
            });
        }
        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Job Board
    // ─────────────────────────────────────────────────────────────────────────────

    @PostMapping("/jobs")
    public ResponseEntity<?> createJob(@RequestBody Map<String, Object> body) {
        String title = (String) body.get("title");
        String company = (String) body.get("company");
        String description = (String) body.get("description");

        if (title == null || company == null || description == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "title, company, and description are required"));
        }

        Job job = new Job();
        job.setTitle(title);
        job.setCompany(company);
        job.setCompanyLogo((String) body.get("companyLogo"));
        job.setLocation((String) body.getOrDefault("location", "Remote"));
        job.setJobType((String) body.getOrDefault("jobType", "Full-time"));
        job.setExperienceLevel((String) body.getOrDefault("experienceLevel", "Mid-Senior level"));
        job.setSalaryRange((String) body.getOrDefault("salaryRange", "$100k - $150k"));
        job.setDescription(description);
        job.setRequirements((String) body.getOrDefault("requirements", ""));
        job.setPosterId((String) body.get("posterId"));
        job.setPosterName((String) body.getOrDefault("posterName", "Recruiter"));
        job.setCreatedAt(System.currentTimeMillis());

        return ResponseEntity.ok(jobRepository.save(job));
    }

    @GetMapping("/jobs")
    public ResponseEntity<?> getJobs(@RequestParam(required = false, defaultValue = "") String q,
                                    @RequestParam(required = false) String userId) {
        List<Job> jobs = q.isBlank() ? jobRepository.findAllByOrderByCreatedAtDesc() : jobRepository.searchJobs(q.trim());
        List<Map<String, Object>> enriched = new ArrayList<>();
        for (Job j : jobs) {
            Map<String, Object> map = new HashMap<>();
            map.put("job", j);
            if (userId != null) {
                map.put("savedByMe", savedJobRepository.findByUserIdAndJobId(userId, j.getId()).isPresent());
                map.put("appliedByMe", jobApplicationRepository.findByJobIdAndApplicantId(j.getId(), userId).isPresent());
            }
            enriched.add(map);
        }
        return ResponseEntity.ok(enriched);
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<?> getJobDetails(@PathVariable Long id, @RequestParam(required = false) String userId) {
        return jobRepository.findById(id).map(j -> {
            Map<String, Object> map = new HashMap<>();
            map.put("job", j);
            if (userId != null) {
                map.put("savedByMe", savedJobRepository.findByUserIdAndJobId(userId, id).isPresent());
                map.put("appliedByMe", jobApplicationRepository.findByJobIdAndApplicantId(id, userId).isPresent());
            }
            return ResponseEntity.ok(map);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/jobs/{id}/apply")
    public ResponseEntity<?> applyForJob(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String applicantId = body.get("applicantId");
        String applicantName = body.getOrDefault("applicantName", "Candidate");
        String applicantEmail = body.getOrDefault("applicantEmail", "");
        String resumeUrl = body.getOrDefault("resumeUrl", "");
        String coverNote = body.getOrDefault("coverNote", "");

        return jobRepository.findById(id).map(job -> {
            Optional<JobApplication> existing = jobApplicationRepository.findByJobIdAndApplicantId(id, applicantId);
            if (existing.isPresent()) {
                return ResponseEntity.ok(Map.of("message", "Already applied for this position", "application", existing.get()));
            }

            JobApplication app = new JobApplication();
            app.setJobId(id);
            app.setJobTitle(job.getTitle());
            app.setCompany(job.getCompany());
            app.setApplicantId(applicantId);
            app.setApplicantName(applicantName);
            app.setApplicantEmail(applicantEmail);
            app.setResumeUrl(resumeUrl);
            app.setCoverNote(coverNote);
            app.setStatus("APPLIED");
            app.setAppliedAt(System.currentTimeMillis());

            job.setApplicantCount(job.getApplicantCount() + 1);
            jobRepository.save(job);

            return ResponseEntity.ok(jobApplicationRepository.save(app));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/jobs/my-applications/{userId}")
    public ResponseEntity<?> getMyApplications(@PathVariable String userId) {
        return ResponseEntity.ok(jobApplicationRepository.findByApplicantIdOrderByAppliedAtDesc(userId));
    }

    @Transactional
    @PostMapping("/jobs/{id}/save")
    public ResponseEntity<?> toggleSaveJob(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        Optional<SavedJob> existing = savedJobRepository.findByUserIdAndJobId(userId, id);
        boolean saved;
        if (existing.isPresent()) {
            savedJobRepository.deleteByUserIdAndJobId(userId, id);
            saved = false;
        } else {
            savedJobRepository.save(new SavedJob(userId, id));
            saved = true;
        }
        return ResponseEntity.ok(Map.of("jobId", id, "saved", saved));
    }

    @GetMapping("/jobs/saved/{userId}")
    public ResponseEntity<?> getSavedJobs(@PathVariable String userId) {
        List<SavedJob> list = savedJobRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Job> jobs = new ArrayList<>();
        for (SavedJob sj : list) {
            jobRepository.findById(sj.getJobId()).ifPresent(jobs::add);
        }
        return ResponseEntity.ok(jobs);
    }

    // Helper to enrich posts
    private List<Map<String, Object>> enrichPosts(List<Post> posts, String userId) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Post p : posts) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("authorId", p.getAuthorId());
            m.put("authorName", p.getAuthorName());
            m.put("authorHeadline", p.getAuthorHeadline());
            m.put("authorAvatar", p.getAuthorAvatar());
            m.put("content", p.getContent());
            m.put("imageUrl", p.getImageUrl());
            m.put("mediaType", p.getMediaType());
            m.put("likesCount", p.getLikesCount());
            m.put("commentsCount", p.getCommentsCount());
            m.put("repostsCount", p.getRepostsCount());
            m.put("createdAt", p.getCreatedAt());
            m.put("updatedAt", p.getUpdatedAt());

            if (userId != null && !userId.isBlank()) {
                m.put("likedByMe", postLikeRepository.findByPostIdAndUserId(p.getId(), userId).isPresent());
                m.put("savedByMe", savedPostRepository.findByUserIdAndPostId(userId, p.getId()).isPresent());
            } else {
                m.put("likedByMe", false);
                m.put("savedByMe", false);
            }
            list.add(m);
        }
        return list;
    }
}
