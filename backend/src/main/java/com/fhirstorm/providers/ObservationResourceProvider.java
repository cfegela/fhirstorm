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
import org.hl7.fhir.r4.model.Observation;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class ObservationResourceProvider implements IResourceProvider {

    private final FhirResourceRepository repository;
    private final FhirContext fhirContext;

    public ObservationResourceProvider(FhirResourceRepository repository) {
        this.repository = repository;
        this.fhirContext = FhirContext.forR4();
    }

    @Override
    public Class<Observation> getResourceType() {
        return Observation.class;
    }

    @Read
    public Observation readObservation(@IdParam IdType theId) {
        Optional<FhirResourceEntity> entityOpt = repository.findByResourceTypeAndResourceId("Observation", theId.getIdPart());
        if (entityOpt.isEmpty()) {
            throw new ResourceNotFoundException("Observation with ID " + theId.getIdPart() + " not found");
        }
        IParser parser = fhirContext.newJsonParser();
        return parser.parseResource(Observation.class, entityOpt.get().getJsonContent());
    }

    @Search
    public List<Observation> searchObservations(@OptionalParam(name = Observation.SP_PATIENT) ReferenceParam patientRef) {
        List<FhirResourceEntity> entities;
        if (patientRef != null && patientRef.getIdPart() != null) {
            entities = repository.findByResourceTypeAndPatientId("Observation", patientRef.getIdPart());
        } else {
            entities = repository.findByResourceType("Observation");
        }

        IParser parser = fhirContext.newJsonParser();
        List<Observation> list = new ArrayList<>();
        for (FhirResourceEntity entity : entities) {
            list.add(parser.parseResource(Observation.class, entity.getJsonContent()));
        }
        return list;
    }

    @Create
    public MethodOutcome createObservation(@ResourceParam Observation theObservation) {
        if (theObservation.getId() == null || theObservation.getIdElement().isEmpty()) {
            theObservation.setId(UUID.randomUUID().toString());
        }

        String idPart = theObservation.getIdElement().getIdPart();
        String patientId = null;
        if (theObservation.hasSubject() && theObservation.getSubject().hasReference()) {
            String ref = theObservation.getSubject().getReference();
            if (ref.startsWith("Patient/")) {
                patientId = ref.substring(8);
            } else {
                patientId = ref;
            }
        }

        IParser parser = fhirContext.newJsonParser();
        String jsonContent = parser.encodeResourceToString(theObservation);

        FhirResourceEntity entity = new FhirResourceEntity();
        entity.setResourceType("Observation");
        entity.setResourceId(idPart);
        entity.setPatientId(patientId);
        entity.setJsonContent(jsonContent);

        repository.save(entity);

        MethodOutcome outcome = new MethodOutcome();
        outcome.setCreated(true);
        outcome.setId(new IdType("Observation", idPart));
        outcome.setResource(theObservation);
        return outcome;
    }

    @Update
    public MethodOutcome updateObservation(@IdParam IdType theId, @ResourceParam Observation theResource) {
        String idPart = theId.getIdPart();
        theResource.setId(idPart);
        IParser parser = fhirContext.newJsonParser();
        String jsonContent = parser.encodeResourceToString(theResource);
        FhirResourceEntity entity = repository.findByResourceTypeAndResourceId("Observation", idPart)
                .orElse(new FhirResourceEntity());
        entity.setResourceType("Observation");
        entity.setResourceId(idPart);

        entity.setJsonContent(jsonContent);
        repository.save(entity);
        MethodOutcome outcome = new MethodOutcome();
        outcome.setId(new IdType("Observation", idPart));
        outcome.setResource(theResource);
        return outcome;
    }

    @Delete
    public void deleteObservation(@IdParam IdType theId) {
        repository.findByResourceTypeAndResourceId("Observation", theId.getIdPart())
                .ifPresent(repository::delete);
    }
}
