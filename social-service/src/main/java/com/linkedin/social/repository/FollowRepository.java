package com.linkedin.social.repository;

import com.linkedin.social.model.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    Optional<Follow> findByFollowerIdAndFollowedId(String followerId, String followedId);
    List<Follow> findByFollowerId(String followerId);
    List<Follow> findByFollowedId(String followedId);
    void deleteByFollowerIdAndFollowedId(String followerId, String followedId);
}
