package com.fhirstorm.repository;

import com.fhirstorm.model.FhirResourceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FhirResourceRepository extends JpaRepository<FhirResourceEntity, Long> {

    Optional<FhirResourceEntity> findByResourceTypeAndResourceId(String resourceType, String resourceId);

    List<FhirResourceEntity> findByResourceType(String resourceType);

    List<FhirResourceEntity> findByResourceTypeAndPatientId(String resourceType, String patientId);

    @Query("SELECT f FROM FhirResourceEntity f WHERE f.resourceType = :resourceType AND LOWER(f.jsonContent) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<FhirResourceEntity> searchByResourceTypeAndQuery(@Param("resourceType") String resourceType, @Param("query") String query);

    void deleteByResourceTypeAndResourceId(String resourceType, String resourceId);
}
