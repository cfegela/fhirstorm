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
import org.hl7.fhir.r4.model.Condition;
import org.hl7.fhir.r4.model.IdType;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class ConditionResourceProvider implements IResourceProvider {

    private final FhirResourceRepository repository;
    private final FhirContext fhirContext;

    public ConditionResourceProvider(FhirResourceRepository repository) {
        this.repository = repository;
        this.fhirContext = FhirContext.forR4();
    }

    @Override
    public Class<Condition> getResourceType() {
        return Condition.class;
    }

    @Read
    public Condition readCondition(@IdParam IdType theId) {
        Optional<FhirResourceEntity> entityOpt = repository.findByResourceTypeAndResourceId("Condition", theId.getIdPart());
        if (entityOpt.isEmpty()) {
            throw new ResourceNotFoundException("Condition with ID " + theId.getIdPart() + " not found");
        }
        IParser parser = fhirContext.newJsonParser();
        return parser.parseResource(Condition.class, entityOpt.get().getJsonContent());
    }

    @Search
    public List<Condition> searchConditions(@OptionalParam(name = Condition.SP_PATIENT) ReferenceParam patientRef) {
        List<FhirResourceEntity> entities;
        if (patientRef != null && patientRef.getIdPart() != null) {
            entities = repository.findByResourceTypeAndPatientId("Condition", patientRef.getIdPart());
        } else {
            entities = repository.findByResourceType("Condition");
        }

        IParser parser = fhirContext.newJsonParser();
        List<Condition> list = new ArrayList<>();
        for (FhirResourceEntity entity : entities) {
            list.add(parser.parseResource(Condition.class, entity.getJsonContent()));
        }
        return list;
    }

    @Create
    public MethodOutcome createCondition(@ResourceParam Condition theCondition) {
        if (theCondition.getId() == null || theCondition.getIdElement().isEmpty()) {
            theCondition.setId(UUID.randomUUID().toString());
        }

        String idPart = theCondition.getIdElement().getIdPart();
        String patientId = null;
        if (theCondition.hasSubject() && theCondition.getSubject().hasReference()) {
            String ref = theCondition.getSubject().getReference();
            if (ref.startsWith("Patient/")) {
                patientId = ref.substring(8);
            } else {
                patientId = ref;
            }
        }

        IParser parser = fhirContext.newJsonParser();
        String jsonContent = parser.encodeResourceToString(theCondition);

        FhirResourceEntity entity = new FhirResourceEntity();
        entity.setResourceType("Condition");
        entity.setResourceId(idPart);
        entity.setPatientId(patientId);
        entity.setJsonContent(jsonContent);

        repository.save(entity);

        MethodOutcome outcome = new MethodOutcome();
        outcome.setCreated(true);
        outcome.setId(new IdType("Condition", idPart));
        outcome.setResource(theCondition);
        return outcome;
    }
}
