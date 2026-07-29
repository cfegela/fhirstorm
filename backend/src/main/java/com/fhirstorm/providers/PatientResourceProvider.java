package com.fhirstorm.providers;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.parser.IParser;
import ca.uhn.fhir.rest.annotation.*;
import ca.uhn.fhir.rest.api.MethodOutcome;
import ca.uhn.fhir.rest.param.StringParam;
import ca.uhn.fhir.rest.server.IResourceProvider;
import ca.uhn.fhir.rest.server.exceptions.ResourceNotFoundException;
import com.fhirstorm.model.FhirResourceEntity;
import com.fhirstorm.repository.FhirResourceRepository;
import org.hl7.fhir.r4.model.IdType;
import org.hl7.fhir.r4.model.Patient;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class PatientResourceProvider implements IResourceProvider {

    private final FhirResourceRepository repository;
    private final FhirContext fhirContext;

    public PatientResourceProvider(FhirResourceRepository repository) {
        this.repository = repository;
        this.fhirContext = FhirContext.forR4();
    }

    @Override
    public Class<Patient> getResourceType() {
        return Patient.class;
    }

    @Read
    public Patient readPatient(@IdParam IdType theId) {
        Optional<FhirResourceEntity> entityOpt = repository.findByResourceTypeAndResourceId("Patient", theId.getIdPart());
        if (entityOpt.isEmpty()) {
            throw new ResourceNotFoundException("Patient with ID " + theId.getIdPart() + " not found");
        }
        IParser parser = fhirContext.newJsonParser();
        return parser.parseResource(Patient.class, entityOpt.get().getJsonContent());
    }

    @Search
    public List<Patient> searchPatients(@OptionalParam(name = Patient.SP_NAME) StringParam theName) {
        List<FhirResourceEntity> entities;
        if (theName != null && theName.getValue() != null && !theName.getValue().isBlank()) {
            entities = repository.searchByResourceTypeAndQuery("Patient", theName.getValue());
        } else {
            entities = repository.findByResourceType("Patient");
        }

        IParser parser = fhirContext.newJsonParser();
        List<Patient> patients = new ArrayList<>();
        for (FhirResourceEntity entity : entities) {
            patients.add(parser.parseResource(Patient.class, entity.getJsonContent()));
        }
        return patients;
    }

    @Create
    public MethodOutcome createPatient(@ResourceParam Patient thePatient) {
        if (thePatient.getId() == null || thePatient.getIdElement().isEmpty()) {
            thePatient.setId(UUID.randomUUID().toString());
        }

        String idPart = thePatient.getIdElement().getIdPart();
        IParser parser = fhirContext.newJsonParser();
        String jsonContent = parser.encodeResourceToString(thePatient);

        FhirResourceEntity entity = new FhirResourceEntity();
        entity.setResourceType("Patient");
        entity.setResourceId(idPart);
        entity.setPatientId(idPart);
        if (!thePatient.getName().isEmpty() && thePatient.getNameFirstRep().hasFamily()) {
            entity.setSearchKey(thePatient.getNameFirstRep().getFamily());
        }
        entity.setJsonContent(jsonContent);

        repository.save(entity);

        MethodOutcome outcome = new MethodOutcome();
        outcome.setCreated(true);
        outcome.setId(new IdType("Patient", idPart));
        outcome.setResource(thePatient);
        return outcome;
    }

    @Update
    public MethodOutcome updatePatient(@IdParam IdType theId, @ResourceParam Patient thePatient) {
        String idPart = theId.getIdPart();
        thePatient.setId(idPart);

        IParser parser = fhirContext.newJsonParser();
        String jsonContent = parser.encodeResourceToString(thePatient);

        FhirResourceEntity entity = repository.findByResourceTypeAndResourceId("Patient", idPart)
                .orElse(new FhirResourceEntity());

        entity.setResourceType("Patient");
        entity.setResourceId(idPart);
        entity.setPatientId(idPart);
        entity.setJsonContent(jsonContent);

        repository.save(entity);

        MethodOutcome outcome = new MethodOutcome();
        outcome.setId(new IdType("Patient", idPart));
        outcome.setResource(thePatient);
        return outcome;
    }

    @Delete
    public void deletePatient(@IdParam IdType theId) {
        repository.findByResourceTypeAndResourceId("Patient", theId.getIdPart())
                .ifPresent(repository::delete);
    }
}
