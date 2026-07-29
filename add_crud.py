import os
import glob

providers_dir = "backend/src/main/java/com/fhirstorm/providers"
files = glob.glob(os.path.join(providers_dir, "*ResourceProvider.java"))

for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    resource_type = os.path.basename(f).replace("ResourceProvider.java", "")
    
    if "@Update" not in content:
        update_method = f"""
    @Update
    public MethodOutcome update{resource_type}(@IdParam IdType theId, @ResourceParam {resource_type} theResource) {{
        String idPart = theId.getIdPart();
        theResource.setId(idPart);
        IParser parser = fhirContext.newJsonParser();
        String jsonContent = parser.encodeResourceToString(theResource);
        FhirResourceEntity entity = repository.findByResourceTypeAndResourceId("{resource_type}", idPart)
                .orElse(new FhirResourceEntity());
        entity.setResourceType("{resource_type}");
        entity.setResourceId(idPart);
        // Assuming there is a subject or patient ref we might need to preserve, but for simplicity:
        if (theResource instanceof org.hl7.fhir.r4.model.Patient) {{
             entity.setPatientId(idPart);
        }}
        entity.setJsonContent(jsonContent);
        repository.save(entity);
        MethodOutcome outcome = new MethodOutcome();
        outcome.setId(new IdType("{resource_type}", idPart));
        outcome.setResource(theResource);
        return outcome;
    }}
"""
        # Insert before the last brace
        content = content.rsplit('}', 1)[0] + update_method + "}\n"
    
    if "@Delete" not in content:
        delete_method = f"""
    @Delete
    public void delete{resource_type}(@IdParam IdType theId) {{
        repository.findByResourceTypeAndResourceId("{resource_type}", theId.getIdPart())
                .ifPresent(repository::delete);
    }}
"""
        content = content.rsplit('}', 1)[0] + delete_method + "}\n"

    with open(f, 'w') as file:
        file.write(content)
