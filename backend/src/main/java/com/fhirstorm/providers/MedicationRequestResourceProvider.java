package com.fhirstorm.providers;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.parser.IParser;
import ca.uhn.fhir.rest.annotation.*;
import ca.uhn.fhir.rest.api.MethodOutcome;
import ca.uhn.fhir.rest.param.ReferenceParam;
import ca.uhn.fhir.rest.server.IResourceProvider;
import ca.uhn.fhir.rest.server.exceptions.ResourceNotFoundException;
import com.fhirstorm.model.FhirResourceEntity;
import com.fhirstorm.repository.FhirResourceRepository;
import org.hl7.fhir.r4.model.IdType;
import org.hl7.fhir.r4.model.MedicationRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class MedicationRequestResourceProvider implements IResourceProvider {

    private final FhirResourceRepository repository;
    private final FhirContext fhirContext;

    public MedicationRequestResourceProvider(FhirResourceRepository repository) {
        this.repository = repository;
        this.fhirContext = FhirContext.forR4();
    }

    @Override
    public Class<MedicationRequest> getResourceType() {
        return MedicationRequest.class;
    }

    @Read
    public MedicationRequest readMedicationRequest(@IdParam IdType theId) {
        Optional<FhirResourceEntity> entityOpt = repository.findByResourceTypeAndResourceId("MedicationRequest", theId.getIdPart());
        if (entityOpt.isEmpty()) {
            throw new ResourceNotFoundException("MedicationRequest with ID " + theId.getIdPart() + " not found");
        }
        IParser parser = fhirContext.newJsonParser();
        return parser.parseResource(MedicationRequest.class, entityOpt.get().getJsonContent());
    }

    @Search
    public List<MedicationRequest> searchMedicationRequests(@OptionalParam(name = MedicationRequest.SP_PATIENT) ReferenceParam patientRef) {
        List<FhirResourceEntity> entities;
        if (patientRef != null && patientRef.getIdPart() != null) {
            entities = repository.findByResourceTypeAndPatientId("MedicationRequest", patientRef.getIdPart());
        } else {
            entities = repository.findByResourceType("MedicationRequest");
        }

        IParser parser = fhirContext.newJsonParser();
        List<MedicationRequest> list = new ArrayList<>();
        for (FhirResourceEntity entity : entities) {
            list.add(parser.parseResource(MedicationRequest.class, entity.getJsonContent()));
        }
        return list;
    }

    @Create
    public MethodOutcome createMedicationRequest(@ResourceParam MedicationRequest theMedicationRequest) {
        if (theMedicationRequest.getId() == null || theMedicationRequest.getIdElement().isEmpty()) {
            theMedicationRequest.setId(UUID.randomUUID().toString());
        }

        String idPart = theMedicationRequest.getIdElement().getIdPart();
        String patientId = null;
        if (theMedicationRequest.hasSubject() && theMedicationRequest.getSubject().hasReference()) {
            String ref = theMedicationRequest.getSubject().getReference();
            if (ref.startsWith("Patient/")) {
                patientId = ref.substring(8);
            } else {
                patientId = ref;
            }
        }

        IParser parser = fhirContext.newJsonParser();
        String jsonContent = parser.encodeResourceToString(theMedicationRequest);

        FhirResourceEntity entity = new FhirResourceEntity();
        entity.setResourceType("MedicationRequest");
        entity.setResourceId(idPart);
        entity.setPatientId(patientId);
        entity.setJsonContent(jsonContent);

        repository.save(entity);

        MethodOutcome outcome = new MethodOutcome();
        outcome.setCreated(true);
        outcome.setId(new IdType("MedicationRequest", idPart));
        outcome.setResource(theMedicationRequest);
        return outcome;
    }
}
