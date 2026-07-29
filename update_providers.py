import os
import glob

providers_dir = "backend/src/main/java/com/fhirstorm/providers"
files = [f for f in glob.glob(os.path.join(providers_dir, "*ResourceProvider.java")) if "PatientResourceProvider" not in f]

for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    resource = os.path.basename(f).replace("ResourceProvider.java", "")
    
    old_update = f"""    @Update
    public MethodOutcome update{resource}(@IdParam IdType theId, @ResourceParam {resource} theResource) {{
        String idPart = theId.getIdPart();
        theResource.setId(idPart);
        IParser parser = fhirContext.newJsonParser();
        String jsonContent = parser.encodeResourceToString(theResource);
        FhirResourceEntity entity = repository.findByResourceTypeAndResourceId("{resource}", idPart)
                .orElse(new FhirResourceEntity());
        entity.setResourceType("{resource}");
        entity.setResourceId(idPart);
        entity.setJsonContent(jsonContent);
        repository.save(entity);
        MethodOutcome outcome = new MethodOutcome();
        outcome.setId(new IdType("{resource}", idPart));
        outcome.setResource(theResource);
        return outcome;
    }}"""

    new_update = f"""    @Update
    public MethodOutcome update{resource}(@IdParam IdType theId, @ResourceParam {resource} theResource) {{
        String idPart = theId.getIdPart();
        theResource.setId(idPart);
        String patientId = null;
        if (theResource.hasSubject() && theResource.getSubject().hasReference()) {{
            String ref = theResource.getSubject().getReference();
            if (ref.startsWith("Patient/")) {{
                patientId = ref.substring(8);
            }} else {{
                patientId = ref;
            }}
        }}
        IParser parser = fhirContext.newJsonParser();
        String jsonContent = parser.encodeResourceToString(theResource);
        FhirResourceEntity entity = repository.findByResourceTypeAndResourceId("{resource}", idPart)
                .orElse(new FhirResourceEntity());
        entity.setResourceType("{resource}");
        entity.setResourceId(idPart);
        entity.setPatientId(patientId);
        entity.setJsonContent(jsonContent);
        repository.save(entity);
        MethodOutcome outcome = new MethodOutcome();
        outcome.setId(new IdType("{resource}", idPart));
        outcome.setResource(theResource);
        return outcome;
    }}"""

    if old_update in content:
        content = content.replace(old_update, new_update)
        with open(f, 'w') as file:
            file.write(content)
            print(f"Updated {f}")

