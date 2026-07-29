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
import org.hl7.fhir.r4.model.Encounter;
import org.hl7.fhir.r4.model.IdType;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class EncounterResourceProvider implements IResourceProvider {

    private final FhirResourceRepository repository;
    private final FhirContext fhirContext;

    public EncounterResourceProvider(FhirResourceRepository repository) {
        this.repository = repository;
        this.fhirContext = FhirContext.forR4();
    }

    @Override
    public Class<Encounter> getResourceType() {
        return Encounter.class;
    }

    @Read
    public Encounter readEncounter(@IdParam IdType theId) {
        Optional<FhirResourceEntity> entityOpt = repository.findByResourceTypeAndResourceId("Encounter", theId.getIdPart());
        if (entityOpt.isEmpty()) {
            throw new ResourceNotFoundException("Encounter with ID " + theId.getIdPart() + " not found");
        }
        IParser parser = fhirContext.newJsonParser();
        return parser.parseResource(Encounter.class, entityOpt.get().getJsonContent());
    }

    @Search
    public List<Encounter> searchEncounters(@OptionalParam(name = Encounter.SP_PATIENT) ReferenceParam patientRef) {
        List<FhirResourceEntity> entities;
        if (patientRef != null && patientRef.getIdPart() != null) {
            entities = repository.findByResourceTypeAndPatientId("Encounter", patientRef.getIdPart());
        } else {
            entities = repository.findByResourceType("Encounter");
        }

        IParser parser = fhirContext.newJsonParser();
        List<Encounter> list = new ArrayList<>();
        for (FhirResourceEntity entity : entities) {
            list.add(parser.parseResource(Encounter.class, entity.getJsonContent()));
        }
        return list;
    }

    @Create
    public MethodOutcome createEncounter(@ResourceParam Encounter theEncounter) {
        if (theEncounter.getId() == null || theEncounter.getIdElement().isEmpty()) {
            theEncounter.setId(UUID.randomUUID().toString());
        }

        String idPart = theEncounter.getIdElement().getIdPart();
        String patientId = null;
        if (theEncounter.hasSubject() && theEncounter.getSubject().hasReference()) {
            String ref = theEncounter.getSubject().getReference();
            if (ref.startsWith("Patient/")) {
                patientId = ref.substring(8);
            } else {
                patientId = ref;
            }
        }

        IParser parser = fhirContext.newJsonParser();
        String jsonContent = parser.encodeResourceToString(theEncounter);

        FhirResourceEntity entity = new FhirResourceEntity();
        entity.setResourceType("Encounter");
        entity.setResourceId(idPart);
        entity.setPatientId(patientId);
        entity.setJsonContent(jsonContent);

        repository.save(entity);

        MethodOutcome outcome = new MethodOutcome();
        outcome.setCreated(true);
        outcome.setId(new IdType("Encounter", idPart));
        outcome.setResource(theEncounter);
        return outcome;
    }
}
