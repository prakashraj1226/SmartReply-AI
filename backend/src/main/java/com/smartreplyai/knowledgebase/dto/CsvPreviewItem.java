package com.smartreplyai.knowledgebase.dto;

public class CsvPreviewItem {

    private int rowIndex;
    private String question;
    private String answer;
    private String categoryName;
    private String keywords;
    private boolean valid;
    private boolean duplicate;
    private String validationError;

    public CsvPreviewItem() {
    }

    public CsvPreviewItem(int rowIndex, String question, String answer, String categoryName, String keywords) {
        this.rowIndex = rowIndex;
        this.question = question;
        this.answer = answer;
        this.categoryName = categoryName;
        this.keywords = keywords;
        this.valid = true;
        this.duplicate = false;
    }

    public int getRowIndex() {
        return rowIndex;
    }

    public void setRowIndex(int rowIndex) {
        this.rowIndex = rowIndex;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getKeywords() {
        return keywords;
    }

    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public boolean isDuplicate() {
        return duplicate;
    }

    public void setDuplicate(boolean duplicate) {
        this.duplicate = duplicate;
    }

    public String getValidationError() {
        return validationError;
    }

    public void setValidationError(String validationError) {
        this.validationError = validationError;
    }
}
