import os
import glob

providers_dir = "backend/src/main/java/com/fhirstorm/providers"
files = glob.glob(os.path.join(providers_dir, "*ResourceProvider.java"))

bad_block = """        // Assuming there is a subject or patient ref we might need to preserve, but for simplicity:
        if (theResource instanceof org.hl7.fhir.r4.model.Patient) {
             entity.setPatientId(idPart);
        }"""

for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    if bad_block in content:
        content = content.replace(bad_block, "")
        with open(f, 'w') as file:
            file.write(content)
