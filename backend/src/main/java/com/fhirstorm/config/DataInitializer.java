package com.fhirstorm.config;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.parser.IParser;
import com.fhirstorm.model.FhirResourceEntity;
import com.fhirstorm.model.UserEntity;
import com.fhirstorm.repository.FhirResourceRepository;
import com.fhirstorm.repository.UserRepository;
import org.hl7.fhir.r4.model.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FhirResourceRepository fhirRepository;
    private final PasswordEncoder passwordEncoder;
    private final FhirContext fhirContext;

    public DataInitializer(UserRepository userRepository, FhirResourceRepository fhirRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.fhirRepository = fhirRepository;
        this.passwordEncoder = passwordEncoder;
        this.fhirContext = FhirContext.forR4();
    }

    @Override
    public void run(String... args) throws Exception {
        initUsers();
        initFhirData();
    }

    private void initUsers() {
        if (!userRepository.existsByUsername("admin@fhirstorm.org")) {
            userRepository.save(new UserEntity("admin@fhirstorm.org", passwordEncoder.encode("admin123"), "Dr. Sarah Connor (Admin)", "ROLE_ADMIN"));
        }
        if (!userRepository.existsByUsername("doctor@fhirstorm.org")) {
            userRepository.save(new UserEntity("doctor@fhirstorm.org", passwordEncoder.encode("doctor123"), "Dr. Alexander Fleming", "ROLE_PRACTITIONER"));
        }
        if (!userRepository.existsByUsername("patient@fhirstorm.org")) {
            userRepository.save(new UserEntity("patient@fhirstorm.org", passwordEncoder.encode("patient123"), "Jane Doe", "ROLE_PATIENT"));
        }
    }

    private void initFhirData() {
        if (fhirRepository.count() > 0) {
            return;
        }

        IParser parser = fhirContext.newJsonParser();

        // 1. Patient 1: Jane Doe
        Patient p1 = new Patient();
        p1.setId("patient-001");
        p1.addIdentifier().setSystem("http://hospital.fhirstorm.org/mrn").setValue("MRN-987654");
        p1.addName().setFamily("Doe").addGiven("Jane").addGiven("Elizabeth");
        p1.setGender(Enumerations.AdministrativeGender.FEMALE);
        p1.setBirthDate(new Date(90, 4, 15)); // May 15, 1990
        p1.addTelecom().setSystem(ContactPoint.ContactPointSystem.PHONE).setValue("555-0199");
        p1.addTelecom().setSystem(ContactPoint.ContactPointSystem.EMAIL).setValue("jane.doe@example.com");
        p1.addAddress().setLine(List.of(new StringType("123 Innovation Way"))).setCity("Boston").setState("MA").setPostalCode("02115");

        saveEntity("Patient", p1.getIdElement().getIdPart(), p1.getIdElement().getIdPart(), "Doe", parser.encodeResourceToString(p1));

        // 2. Patient 2: John Smith
        Patient p2 = new Patient();
        p2.setId("patient-002");
        p2.addIdentifier().setSystem("http://hospital.fhirstorm.org/mrn").setValue("MRN-112233");
        p2.addName().setFamily("Smith").addGiven("John").addGiven("Robert");
        p2.setGender(Enumerations.AdministrativeGender.MALE);
        p2.setBirthDate(new Date(85, 9, 24)); // Oct 24, 1985
        p2.addTelecom().setSystem(ContactPoint.ContactPointSystem.PHONE).setValue("555-0842");
        p2.addTelecom().setSystem(ContactPoint.ContactPointSystem.EMAIL).setValue("john.smith@example.com");
        p2.addAddress().setLine(List.of(new StringType("456 Beacon Hill"))).setCity("Boston").setState("MA").setPostalCode("02108");

        saveEntity("Patient", p2.getIdElement().getIdPart(), p2.getIdElement().getIdPart(), "Smith", parser.encodeResourceToString(p2));

        // 3. Observations for Jane Doe (Vitals: Heart Rate, Blood Pressure, Temperature)
        Observation obs1 = new Observation();
        obs1.setId("obs-001");
        obs1.setStatus(Observation.ObservationStatus.FINAL);
        obs1.getCode().addCoding().setSystem("http://loinc.org").setCode("8867-4").setDisplay("Heart rate");
        obs1.getSubject().setReference("Patient/patient-001");
        obs1.setValue(new Quantity().setValue(72).setUnit("beats/min").setSystem("http://unitsofmeasure.org").setCode("/min"));
        obs1.setEffective(new DateTimeType(new Date()));
        saveEntity("Observation", obs1.getIdElement().getIdPart(), "patient-001", "Heart rate", parser.encodeResourceToString(obs1));

        Observation obs2 = new Observation();
        obs2.setId("obs-002");
        obs2.setStatus(Observation.ObservationStatus.FINAL);
        obs2.getCode().addCoding().setSystem("http://loinc.org").setCode("85354-9").setDisplay("Blood Pressure");
        obs2.getSubject().setReference("Patient/patient-001");
        Observation.ObservationComponentComponent sys = obs2.addComponent();
        sys.getCode().addCoding().setSystem("http://loinc.org").setCode("8480-6").setDisplay("Systolic BP");
        sys.setValue(new Quantity().setValue(120).setUnit("mmHg"));
        Observation.ObservationComponentComponent dia = obs2.addComponent();
        dia.getCode().addCoding().setSystem("http://loinc.org").setCode("8462-4").setDisplay("Diastolic BP");
        dia.setValue(new Quantity().setValue(80).setUnit("mmHg"));
        obs2.setEffective(new DateTimeType(new Date()));
        saveEntity("Observation", obs2.getIdElement().getIdPart(), "patient-001", "Blood Pressure", parser.encodeResourceToString(obs2));

        // 4. Condition for Jane Doe
        Condition cond1 = new Condition();
        cond1.setId("cond-001");
        cond1.getClinicalStatus().addCoding().setSystem("http://terminology.hl7.org/CodeSystem/condition-clinical").setCode("active").setDisplay("Active");
        cond1.getVerificationStatus().addCoding().setSystem("http://terminology.hl7.org/CodeSystem/condition-ver-status").setCode("confirmed");
        cond1.getCode().addCoding().setSystem("http://snomed.info/sct").setCode("38341003").setDisplay("Essential Hypertension");
        cond1.getSubject().setReference("Patient/patient-001");
        saveEntity("Condition", cond1.getIdElement().getIdPart(), "patient-001", "Hypertension", parser.encodeResourceToString(cond1));

        // 5. MedicationRequest for Jane Doe
        MedicationRequest med1 = new MedicationRequest();
        med1.setId("med-001");
        med1.setStatus(MedicationRequest.MedicationRequestStatus.ACTIVE);
        med1.setIntent(MedicationRequest.MedicationRequestIntent.ORDER);
        med1.getMedicationCodeableConcept().addCoding().setSystem("http://www.nlm.nih.gov/research/umls/rxnorm").setCode("314076").setDisplay("Lisinopril 10 MG Oral Tablet");
        med1.getSubject().setReference("Patient/patient-001");
        saveEntity("MedicationRequest", med1.getIdElement().getIdPart(), "patient-001", "Lisinopril", parser.encodeResourceToString(med1));

        // 6. Encounter for Jane Doe
        Encounter enc1 = new Encounter();
        enc1.setId("enc-001");
        enc1.setStatus(Encounter.EncounterStatus.FINISHED);
        enc1.getClass_().setSystem("http://terminology.hl7.org/CodeSystem/v3-ActCode").setCode("AMB").setDisplay("ambulatory");
        enc1.getSubject().setReference("Patient/patient-001");
        enc1.addType().addCoding().setSystem("http://snomed.info/sct").setCode("11429006").setDisplay("Consultation");
        saveEntity("Encounter", enc1.getIdElement().getIdPart(), "patient-001", "Consultation", parser.encodeResourceToString(enc1));
    }

    private void saveEntity(String type, String resId, String patientId, String searchKey, String json) {
        FhirResourceEntity entity = new FhirResourceEntity();
        entity.setResourceType(type);
        entity.setResourceId(resId);
        entity.setPatientId(patientId);
        entity.setSearchKey(searchKey);
        entity.setJsonContent(json);
        fhirRepository.save(entity);
    }
}
