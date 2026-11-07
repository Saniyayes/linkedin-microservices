package com.linkedin.post.repository;

import com.linkedin.post.model.SavedPost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {
    List<SavedPost> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<SavedPost> findByUserIdAndPostId(String userId, Long postId);
    void deleteByUserIdAndPostId(String userId, Long postId);
}
