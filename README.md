# ⚡ FHIRStorm - Patient Medical Records Management System

FHIRStorm is a full-stack, containerized Patient Medical Records Management System adhering strictly to the **HL7 FHIR R4 standard**, built with **Java (Spring Boot + HAPI FHIR)**, **PostgreSQL**, and a modern **Vanilla JavaScript & CSS** frontend.

---

## 🏗️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, Vanilla CSS3 | Clean Light & Navy Blue clinical design system, responsive clinical dashboard, FHIR JSON inspector |
| **Backend API** | Java 17, Spring Boot 2.7.18, HAPI FHIR R4 6.8.0 | Industry gold-standard reference implementation |
| **Database** | PostgreSQL 15 | SQL-backed FHIR JSON storage & indexed search parameters |
| **Auth** | OAuth 2.0 / JWT (JSON Web Tokens) | Signed token authentication with Role-Based Access Control (Admin, Practitioner, Patient) protecting all `/fhir/**` endpoints |
| **Orchestration** | Podman Compose / Docker Compose | Containerized multi-service execution (`arm64` & `amd64` compatible) |

---

## 🚀 Quick Start (Podman Compose or Docker Compose)

You can run the full application stack locally using **Docker Compose**:

```bash
# Start all containers
docker compose up -d --build

# View backend logs
docker logs fhirstorm-backend -f

# Stop containers
docker compose down
```

> **Tip:** The `./frontend` directory is mounted live into the Nginx container (`:ro`), allowing frontend HTML, CSS, and JS edits to take effect immediately upon browser refresh (`F5` / `Cmd` + `R`).

Once the stack is running, access the services at [http://localhost](http://localhost)

---

## 🔐 Preset User Accounts & JWT Authentication

The system automatically initializes default user accounts with signed JWT token generation. Click the user profile icon in the web dashboard or use the REST API:

| Role | Username / Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Practitioner (Doctor)** | `doctor@fhirstorm.org` | `doctor123` | Read/Write Patient records, Record Vitals & Prescriptions |
| **Administrator** | `admin@fhirstorm.org` | `admin123` | Full system administrative access |
| **Patient** | `patient@fhirstorm.org` | `patient123` | Patient self-service portal |

### Example JWT Login Request

```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"doctor@fhirstorm.org","password":"doctor123"}'
```

---

## 🩺 Supported FHIR R4 Resources & Operations

FHIRStorm provides full CRUD RESTful endpoints adhering to HL7 FHIR R4:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/fhir/Patient` | `GET` | Query all patients or search by name (`?name=Doe`) |
| `/fhir/Patient/{id}` | `GET` | Read patient resource by ID |
| `/fhir/Patient` | `POST` | Create a new FHIR Patient resource |
| `/fhir/Patient/{id}` | `PUT` | Update an existing FHIR Patient resource |
| `/fhir/Patient/{id}` | `DELETE` | Delete a FHIR Patient resource |
| `/fhir/Observation` | `GET`, `POST`, `PUT`, `DELETE` | Full CRUD operations for vital sign Observations |
| `/fhir/Condition` | `GET`, `POST`, `PUT`, `DELETE` | Full CRUD operations for diagnoses & SNOMED conditions |
| `/fhir/MedicationRequest` | `GET`, `POST`, `PUT`, `DELETE` | Full CRUD operations for RxNorm active prescriptions |
| `/fhir/Encounter` | `GET`, `POST`, `PUT`, `DELETE` | Full CRUD operations for clinical encounters |
| `/fhir/metadata` | `GET` | Fetch server `CapabilityStatement` |

---

## 📁 Repository Structure

```
fhirstorm/
├── backend/
│   ├── src/main/java/com/fhirstorm/
│   │   ├── FhirstormApplication.java
│   │   ├── config/ (FhirServerConfig, SecurityConfig, DataInitializer)
│   │   ├── providers/ (Patient, Observation, Condition, Encounter, MedicationRequest)
│   │   ├── model/ & repository/ (PostgreSQL FHIR entities)
│   │   └── security/ (JWT Auth Controller & Security Filters)
│   ├── pom.xml
│   └── Dockerfile (Multi-stage build)
├── frontend/
│   ├── index.html
│   ├── css/styles.css (Clean Light & Navy Blue design system)
│   ├── js/ (app.js, api.js, auth.js)
│   ├── nginx.conf (Static server & API reverse proxy)
│   └── Dockerfile
├── docker-compose.yml
├── init-db.sql
└── README.md
```
