package com.smartreplyai.business;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BusinessMemberRepository extends JpaRepository<BusinessMember, UUID> {
    List<BusinessMember> findByUserId(UUID userId);
    List<BusinessMember> findByBusinessId(UUID businessId);
    Optional<BusinessMember> findByBusinessIdAndUserId(UUID businessId, UUID userId);
    boolean existsByBusinessIdAndUserId(UUID businessId, UUID userId);

    @Query("SELECT bm.business FROM BusinessMember bm WHERE bm.user.id = :userId")
    List<Business> findBusinessesByUserId(@Param("userId") UUID userId);

    @Query("SELECT bm FROM BusinessMember bm LEFT JOIN FETCH bm.user WHERE bm.business.id = :businessId ORDER BY bm.joinedAt ASC")
    List<BusinessMember> findByBusinessIdWithUser(@Param("businessId") UUID businessId);
}
