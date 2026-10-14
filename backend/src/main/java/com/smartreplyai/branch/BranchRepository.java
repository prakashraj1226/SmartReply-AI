package com.smartreplyai.branch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BranchRepository extends JpaRepository<Branch, UUID> {
    List<Branch> findByBusinessIdAndIsActiveTrue(UUID businessId);
    List<Branch> findByBusinessId(UUID businessId);
    Optional<Branch> findByBusinessIdAndId(UUID businessId, UUID id);
    boolean existsByBusinessIdAndName(UUID businessId, String name);
    long countByBusinessId(UUID businessId);
    long countByBusinessIdAndIsActiveTrue(UUID businessId);
}
