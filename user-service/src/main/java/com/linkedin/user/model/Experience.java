package com.linkedin.user.model;

import jakarta.persistence.Embeddable;

@Embeddable
public class Experience {
    private String id;
    private String title;
    private String company;
    private String location;
    private String startDate;
    private String endDate;
    private boolean isCurrent;
    private String description;

    public Experience() {}

    public Experience(String id, String title, String company, String location, String startDate, String endDate, boolean isCurrent, String description) {
        this.id = id;
        this.title = title;
        this.company = company;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.isCurrent = isCurrent;
        this.description = description;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public boolean isCurrent() { return isCurrent; }
    public void setCurrent(boolean current) { isCurrent = current; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
