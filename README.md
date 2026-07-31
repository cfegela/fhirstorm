# FHIRStorm

FHIRStorm is designed to serve as a reference implementation for managing clinical data using strict compliance to the **HL7 FHIR R4** standard. The system is built with a highly responsive, modern clinical dashboard connected to a robust Java backend powered by the industry-standard HAPI FHIR library.

---

## Technology Stack

| Layer | Component |
| :--- | :--- |
| **Frontend** | Vanilla JS (ES6+), HTML5, CSS3 |
| **Backend API** | Java 21, Spring Boot 3.x, HAPI FHIR R4 |
| **Database** | PostgreSQL 17 |
| **Local Development** | Docker Compose |

---

## Quick Start (Docker Compose)

Get the complete application stack running locally in seconds:

```bash
# Start all containers in background mode
docker compose up -d --build

# Stop and clean up container resources
docker compose down
```

Once the local environment is up, open your browser and navigate to **[http://localhost](http://localhost)**.

---

## Supported FHIR R4 Resources & Operations

FHIRStorm provides complete CRUD RESTful endpoints adhering to HL7 FHIR specification:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/fhir/Patient` | `GET` | Query all patients or search by name (`?name=Doe`) |
| `/fhir/Patient/{id}` | `GET` | Read patient resource by ID |
| `/fhir/Patient` | `POST` | Create a new FHIR Patient resource |
| `/fhir/Patient/{id}` | `PUT` | Update an existing FHIR Patient resource |
| `/fhir/Patient/{id}` | `DELETE` | Delete a FHIR Patient resource |
| `/fhir/Observation` | `GET`, `POST`, `PUT`, `DELETE` | CRUD operations for vital sign Observations |
| `/fhir/Condition` | `GET`, `POST`, `PUT`, `DELETE` | CRUD operations for diagnoses & SNOMED conditions |
| `/fhir/MedicationRequest` | `GET`, `POST`, `PUT`, `DELETE` | CRUD operations for RxNorm active prescriptions |
| `/fhir/Encounter` | `GET`, `POST`, `PUT`, `DELETE` | CRUD operations for clinical encounters |
| `/fhir/metadata` | `GET` | Fetch server CapabilityStatement |

