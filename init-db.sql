-- Create database extension for UUID if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Database initialization script for FHIRStorm PostgreSQL
CREATE DATABASE fhirstorm;
GRANT ALL PRIVILEGES ON DATABASE fhirstorm TO fhiruser;
