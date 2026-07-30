package com.fhirstorm.config;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.rest.openapi.OpenApiInterceptor;
import ca.uhn.fhir.rest.server.RestfulServer;
import ca.uhn.fhir.rest.server.interceptor.ResponseHighlighterInterceptor;
import com.fhirstorm.providers.*;
import jakarta.servlet.ServletException;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class FhirServerConfig {

    private final PatientResourceProvider patientResourceProvider;
    private final ObservationResourceProvider observationResourceProvider;
    private final EncounterResourceProvider encounterResourceProvider;
    private final ConditionResourceProvider conditionResourceProvider;
    private final MedicationRequestResourceProvider medicationRequestResourceProvider;

    public FhirServerConfig(
            PatientResourceProvider patientResourceProvider,
            ObservationResourceProvider observationResourceProvider,
            EncounterResourceProvider encounterResourceProvider,
            ConditionResourceProvider conditionResourceProvider,
            MedicationRequestResourceProvider medicationRequestResourceProvider) {
        this.patientResourceProvider = patientResourceProvider;
        this.observationResourceProvider = observationResourceProvider;
        this.encounterResourceProvider = encounterResourceProvider;
        this.conditionResourceProvider = conditionResourceProvider;
        this.medicationRequestResourceProvider = medicationRequestResourceProvider;
    }

    @Bean
    public ServletRegistrationBean<RestfulServer> fhirServletRegistration() {
        RestfulServer server = new RestfulServer(FhirContext.forR4()) {
            @Override
            protected void initialize() throws ServletException {
                super.initialize();
                setResourceProviders(List.of(
                        patientResourceProvider,
                        observationResourceProvider,
                        encounterResourceProvider,
                        conditionResourceProvider,
                        medicationRequestResourceProvider
                ));
                registerInterceptor(new ResponseHighlighterInterceptor());
                registerInterceptor(new OpenApiInterceptor());
            }
        };

        ServletRegistrationBean<RestfulServer> registration = new ServletRegistrationBean<>(server, "/fhir/*");
        registration.setName("FHIRServerServlet");
        registration.setLoadOnStartup(1);
        return registration;
    }
}
