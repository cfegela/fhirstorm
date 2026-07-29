# ⚡ FHIRStorm - Patient Medical Records Management System

FHIRStorm is a full-stack, containerized Patient Medical Records Management System adhering strictly to the **HL7 FHIR R4 standard**, built with **Java (Spring Boot + HAPI FHIR)**, **PostgreSQL**, and a modern **Vanilla JavaScript & CSS** frontend.

---

## 🏗️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, Vanilla CSS3 | Dark glassmorphism design system, responsive clinical dashboard, FHIR JSON inspector |
| **Backend API** | Java 17, Spring Boot 2.7.18, HAPI FHIR R4 6.8.0 | Industry gold-standard reference implementation |
| **Database** | PostgreSQL 15 | SQL-backed FHIR JSON storage & indexed search parameters |
| **Auth** | OAuth 2.0 / JWT (JSON Web Tokens) | Signed token authentication with Role-Based Access Control (Admin, Practitioner, Patient) |
| **Orchestration** | Podman Compose / Docker Compose | Containerized multi-service execution (`arm64` & `amd64` compatible) |

---

## 🚀 Quick Start (Podman Compose or Docker Compose)

You can run the full application stack locally using either **Podman Compose** or **Docker Compose**:

### Using Podman Compose
```bash
# Start all containers in detached mode
podman compose up -d --build

# Inspect container status
podman ps

# View backend application logs
podman logs fhirstorm-backend -f

# Stop and remove containers
podman compose down
```

### Using Docker Compose
```bash
# Start all containers
docker compose up -d --build

# View backend logs
docker logs fhirstorm-backend -f

# Stop containers
docker compose down
```

---

## 🌐 Application Endpoints

Once the stack is running, access the services:

- **Frontend Dashboard:** [http://localhost](http://localhost)
- **FHIR REST API Base:** [http://localhost/fhir/](http://localhost/fhir/)
- **FHIR CapabilityStatement:** [http://localhost/fhir/metadata](http://localhost/fhir/metadata)
- **JWT Authentication API:** [http://localhost/api/auth/login](http://localhost/api/auth/login)

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

FHIRStorm provides RESTful endpoints adhering to HL7 FHIR R4:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/fhir/Patient` | `GET` | Query all patients or search by name (`?name=Doe`) |
| `/fhir/Patient/{id}` | `GET` | Read patient resource by ID |
| `/fhir/Patient` | `POST` | Create a new FHIR Patient resource |
| `/fhir/Observation` | `GET` | Query vital sign observations (`?patient=patient-001`) |
| `/fhir/Observation` | `POST` | Record a new vital sign Observation (Heart rate, Blood pressure, etc.) |
| `/fhir/Condition` | `GET` | Query active diagnoses and SNOMED conditions |
| `/fhir/MedicationRequest` | `GET` | Query RxNorm active prescriptions |
| `/fhir/Encounter` | `GET` | Query clinical consultation encounters timeline |
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
│   ├── css/styles.css (Glassmorphism design system)
│   ├── js/ (app.js, api.js, auth.js)
│   ├── nginx.conf (Static server & API reverse proxy)
│   └── Dockerfile
├── docker-compose.yml
├── init-db.sql
└── README.md
```
