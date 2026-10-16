package com.smartreplyai.knowledgebase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KnowledgeArticleRepository extends JpaRepository<KnowledgeArticle, UUID> {

    Page<KnowledgeArticle> findByBusinessId(UUID businessId, Pageable pageable);

    Page<KnowledgeArticle> findByBusinessIdAndCategoryId(UUID businessId, UUID categoryId, Pageable pageable);

    Optional<KnowledgeArticle> findByBusinessIdAndId(UUID businessId, UUID id);

    List<KnowledgeArticle> findByBusinessIdAndIsActiveTrue(UUID businessId);

    long countByBusinessId(UUID businessId);

    long countByBusinessIdAndTypeIgnoreCase(UUID businessId, String type);

    boolean existsByBusinessIdAndQuestionIgnoreCase(UUID businessId, String question);

    @Query("SELECT a FROM KnowledgeArticle a WHERE a.business.id = :businessId AND " +
            "(LOWER(a.question) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.answer) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.keywords) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<KnowledgeArticle> searchArticles(@Param("businessId") UUID businessId,
                                          @Param("query") String query,
                                          Pageable pageable);
}
