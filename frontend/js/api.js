const API = {
    BASE_URL: '/fhir',

    async fetchFHIR(endpoint, options = {}) {
        const headers = {
            ...Auth.getAuthHeaders(),
            ...(options.headers || {})
        };

        const config = {
            ...options,
            headers
        };

        const url = endpoint.startsWith('http') ? endpoint : `${this.BASE_URL}${endpoint}`;
        const response = await fetch(url, config);

        if (!response.ok) {
            throw new Error(`FHIR API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    },

    async getPatients(nameQuery = '') {
        const query = nameQuery ? `?name=${encodeURIComponent(nameQuery)}` : '';
        const data = await this.fetchFHIR(`/Patient${query}`);
        // Handle Bundle or List return
        if (data.resourceType === 'Bundle' && data.entry) {
            return data.entry.map(e => e.resource);
        }
        return Array.isArray(data) ? data : [];
    },

    async getPatientById(id) {
        return await this.fetchFHIR(`/Patient/${id}`);
    },

    async createPatient(givenName, familyName, gender, birthDate, phone, email) {
        const patientResource = {
            resourceType: "Patient",
            name: [{
                use: "official",
                family: familyName,
                given: [givenName]
            }],
            gender: gender,
            birthDate: birthDate,
            telecom: []
        };

        if (phone) {
            patientResource.telecom.push({ system: "phone", value: phone });
        }
        if (email) {
            patientResource.telecom.push({ system: "email", value: email });
        }

        return await this.fetchFHIR('/Patient', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patientResource)
        });
    },

    async getObservations(patientId = null) {
        const query = patientId ? `?patient=${patientId}` : '';
        const data = await this.fetchFHIR(`/Observation${query}`);
        return Array.isArray(data) ? data : [];
    },

    async createObservation(patientId, code, display, unit, value) {
        const obsResource = {
            resourceType: "Observation",
            status: "final",
            code: {
                coding: [{
                    system: "http://loinc.org",
                    code: code,
                    display: display
                }]
            },
            subject: {
                reference: `Patient/${patientId}`
            },
            valueQuantity: {
                value: parseFloat(value),
                unit: unit,
                system: "http://unitsofmeasure.org"
            },
            effectiveDateTime: new Date().toISOString()
        };

        return await this.fetchFHIR('/Observation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(obsResource)
        });
    },

    async getConditions(patientId = null) {
        const query = patientId ? `?patient=${patientId}` : '';
        const data = await this.fetchFHIR(`/Condition${query}`);
        return Array.isArray(data) ? data : [];
    },

    async getMedicationRequests(patientId = null) {
        const query = patientId ? `?patient=${patientId}` : '';
        const data = await this.fetchFHIR(`/MedicationRequest${query}`);
        return Array.isArray(data) ? data : [];
    },

    async getEncounters(patientId = null) {
        const query = patientId ? `?patient=${patientId}` : '';
        const data = await this.fetchFHIR(`/Encounter${query}`);
        return Array.isArray(data) ? data : [];
    },

    async getCapabilityStatement() {
        return await this.fetchFHIR('/metadata');
    }
};

window.API = API;
