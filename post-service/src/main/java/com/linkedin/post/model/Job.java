package com.linkedin.post.model;

import jakarta.persistence.*;

@Entity
@Table(name = "jobs", indexes = {
    @Index(name = "idx_job_title", columnList = "title"),
    @Index(name = "idx_job_company", columnList = "company"),
    @Index(name = "idx_job_location", columnList = "location")
})
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String company;

    private String companyLogo;
    private String location;
    private String jobType; // Full-time, Contract, Remote, Hybrid
    private String experienceLevel; // Entry level, Mid-Senior, Lead, Director
    private String salaryRange;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    private String posterId;
    private String posterName;
    private int applicantCount = 0;
    private long createdAt;

    public Job() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getCompanyLogo() { return companyLogo; }
    public void setCompanyLogo(String companyLogo) { this.companyLogo = companyLogo; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getJobType() { return jobType; }
    public void setJobType(String jobType) { this.jobType = jobType; }
    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }
    public String getSalaryRange() { return salaryRange; }
    public void setSalaryRange(String salaryRange) { this.salaryRange = salaryRange; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }
    public String getPosterId() { return posterId; }
    public void setPosterId(String posterId) { this.posterId = posterId; }
    public String getPosterName() { return posterName; }
    public void setPosterName(String posterName) { this.posterName = posterName; }
    public int getApplicantCount() { return applicantCount; }
    public void setApplicantCount(int applicantCount) { this.applicantCount = applicantCount; }
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
