package com.linkedin.post.repository;

import com.linkedin.post.model.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByApplicantIdOrderByAppliedAtDesc(String applicantId);
    List<JobApplication> findByJobIdOrderByAppliedAtDesc(Long jobId);
    Optional<JobApplication> findByJobIdAndApplicantId(Long jobId, String applicantId);
}
