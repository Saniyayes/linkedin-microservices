package com.linkedin.post.repository;

import com.linkedin.post.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    List<PostLike> findByPostId(Long postId);
    Optional<PostLike> findByPostIdAndUserId(Long postId, String userId);
    int countByPostId(Long postId);
    void deleteByPostIdAndUserId(Long postId, String userId);
}
