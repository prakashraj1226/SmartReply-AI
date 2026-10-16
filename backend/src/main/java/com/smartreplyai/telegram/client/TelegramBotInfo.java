package com.smartreplyai.telegram.client;

public class TelegramBotInfo {

    private boolean valid;
    private String username;
    private String firstName;
    private Long id;
    private String errorMessage;

    public TelegramBotInfo() {
    }

    public TelegramBotInfo(boolean valid, String username, String firstName, Long id, String errorMessage) {
        this.valid = valid;
        this.username = username;
        this.firstName = firstName;
        this.id = id;
        this.errorMessage = errorMessage;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
