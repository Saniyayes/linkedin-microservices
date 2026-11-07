package com.linkedin.post.repository;

import com.linkedin.post.model.SavedJob;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {
    List<SavedJob> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<SavedJob> findByUserIdAndJobId(String userId, Long jobId);
    void deleteByUserIdAndJobId(String userId, Long jobId);
}
