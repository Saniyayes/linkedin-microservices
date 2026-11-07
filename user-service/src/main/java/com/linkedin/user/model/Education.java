package com.linkedin.user.model;

import jakarta.persistence.Embeddable;

@Embeddable
public class Education {
    private String id;
    private String school;
    private String degree;
    private String fieldOfStudy;
    private String startYear;
    private String endYear;
    private String grade;

    public Education() {}

    public Education(String id, String school, String degree, String fieldOfStudy, String startYear, String endYear, String grade) {
        this.id = id;
        this.school = school;
        this.degree = degree;
        this.fieldOfStudy = fieldOfStudy;
        this.startYear = startYear;
        this.endYear = endYear;
        this.grade = grade;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSchool() { return school; }
    public void setSchool(String school) { this.school = school; }
    public String getDegree() { return degree; }
    public void setDegree(String degree) { this.degree = degree; }
    public String getFieldOfStudy() { return fieldOfStudy; }
    public void setFieldOfStudy(String fieldOfStudy) { this.fieldOfStudy = fieldOfStudy; }
    public String getStartYear() { return startYear; }
    public void setStartYear(String startYear) { this.startYear = startYear; }
    public String getEndYear() { return endYear; }
    public void setEndYear(String endYear) { this.endYear = endYear; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
}
