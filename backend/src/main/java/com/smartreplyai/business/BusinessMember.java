package com.smartreplyai.business;

import com.smartreplyai.auth.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "business_members", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"business_id", "user_id"})
})
public class BusinessMember {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String role; // OWNER, AGENT, ADMIN

    @Column(name = "permissions_json", columnDefinition = "TEXT")
    private String permissionsJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public BusinessMember() {
    }

    public BusinessMember(Business business, User user, String role) {
        this.business = business;
        this.user = user;
        this.role = role;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Business getBusiness() {
        return business;
    }

    public void setBusiness(Business business) {
        this.business = business;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPermissionsJson() {
        return permissionsJson;
    }

    public void setPermissionsJson(String permissionsJson) {
        this.permissionsJson = permissionsJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
