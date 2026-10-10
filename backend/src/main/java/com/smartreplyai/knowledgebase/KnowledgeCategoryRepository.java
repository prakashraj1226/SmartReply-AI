package com.smartreplyai.knowledgebase;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KnowledgeCategoryRepository extends JpaRepository<KnowledgeCategory, UUID> {
    List<KnowledgeCategory> findByBusinessIdOrderByDisplayOrderAsc(UUID businessId);
    Optional<KnowledgeCategory> findByBusinessIdAndId(UUID businessId, UUID id);
    Optional<KnowledgeCategory> findByBusinessIdAndNameIgnoreCase(UUID businessId, String name);
}
