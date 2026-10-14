package com.smartreplyai.business.onboarding;

import jakarta.validation.constraints.NotBlank;

public class ApplyTemplateRequest {

    @NotBlank(message = "Industry type is required (e.g. SALON, DENTAL_CLINIC, HOSPITAL, GENERAL)")
    private String industryType;

    private String branchName;

    public ApplyTemplateRequest() {
    }

    public ApplyTemplateRequest(String industryType) {
        this.industryType = industryType;
    }

    public String getIndustryType() {
        return industryType;
    }

    public void setIndustryType(String industryType) {
        this.industryType = industryType;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }
}
