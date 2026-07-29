package com.fhirstorm.model;

import javax.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "fhir_resources", indexes = {
    @Index(name = "idx_res_type", columnList = "resourceType"),
    @Index(name = "idx_res_type_id", columnList = "resourceType, resourceId", unique = true),
    @Index(name = "idx_patient_id", columnList = "patientId"),
    @Index(name = "idx_search_key", columnList = "searchKey")
})
@Getter
@Setter
@NoArgsConstructor
public class FhirResourceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String resourceType;

    @Column(nullable = false, length = 128)
    private String resourceId;

    @Column(length = 128)
    private String patientId;

    @Column(length = 256)
    private String searchKey;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String jsonContent;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
