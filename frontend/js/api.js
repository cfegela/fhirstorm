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

        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return { success: true };
        }

        const text = await response.text();
        return text ? JSON.parse(text) : { success: true };
    },

    parseBundleOrList(data) {
        if (!data) return [];
        if (data.resourceType === 'Bundle' && data.entry) {
            return data.entry.map(e => e.resource);
        }
        return Array.isArray(data) ? data : [];
    },

    // --- PATIENTS ---
    async getPatients(nameQuery = '') {
        const query = nameQuery ? `?name=${encodeURIComponent(nameQuery)}` : '';
        const data = await this.fetchFHIR(`/Patient${query}`);
        return this.parseBundleOrList(data);
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

    async deletePatient(id) {
        return await this.fetchFHIR(`/Patient/${id}`, {
            method: 'DELETE'
        });
    },

    // --- OBSERVATIONS ---
    async getObservations(patientId = null) {
        const query = patientId ? `?patient=${patientId}` : '';
        const data = await this.fetchFHIR(`/Observation${query}`);
        return this.parseBundleOrList(data);
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

    async deleteObservation(id) {
        return await this.fetchFHIR(`/Observation/${id}`, {
            method: 'DELETE'
        });
    },

    // --- CONDITIONS ---
    async getConditions(patientId = null) {
        const query = patientId ? `?patient=${patientId}` : '';
        const data = await this.fetchFHIR(`/Condition${query}`);
        return this.parseBundleOrList(data);
    },

    async createCondition(patientId, code, display) {
        const condResource = {
            resourceType: "Condition",
            clinicalStatus: {
                coding: [{
                    system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
                    code: "active",
                    display: "Active"
                }]
            },
            verificationStatus: {
                coding: [{
                    system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                    code: "confirmed",
                    display: "Confirmed"
                }]
            },
            code: {
                coding: [{
                    system: "http://snomed.info/sct",
                    code: code,
                    display: display
                }]
            },
            subject: {
                reference: `Patient/${patientId}`
            },
            recordedDate: new Date().toISOString().split('T')[0]
        };

        return await this.fetchFHIR('/Condition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(condResource)
        });
    },

    async deleteCondition(id) {
        return await this.fetchFHIR(`/Condition/${id}`, {
            method: 'DELETE'
        });
    },

    // --- MEDICATIONS ---
    async getMedicationRequests(patientId = null) {
        const query = patientId ? `?patient=${patientId}` : '';
        const data = await this.fetchFHIR(`/MedicationRequest${query}`);
        return this.parseBundleOrList(data);
    },

    async createMedicationRequest(patientId, code, display) {
        const medResource = {
            resourceType: "MedicationRequest",
            status: "active",
            intent: "order",
            medicationCodeableConcept: {
                coding: [{
                    system: "http://www.nlm.nih.gov/research/umls/rxnorm",
                    code: code,
                    display: display
                }]
            },
            subject: {
                reference: `Patient/${patientId}`
            },
            authoredOn: new Date().toISOString()
        };

        return await this.fetchFHIR('/MedicationRequest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(medResource)
        });
    },

    async deleteMedicationRequest(id) {
        return await this.fetchFHIR(`/MedicationRequest/${id}`, {
            method: 'DELETE'
        });
    },

    // --- ENCOUNTERS ---
    async getEncounters(patientId = null) {
        const query = patientId ? `?patient=${patientId}` : '';
        const data = await this.fetchFHIR(`/Encounter${query}`);
        return this.parseBundleOrList(data);
    },

    async createEncounter(patientId, classCode, classDisplay, typeCode, typeDisplay) {
        const encResource = {
            resourceType: "Encounter",
            status: "finished",
            class: {
                system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                code: classCode,
                display: classDisplay
            },
            type: [{
                coding: [{
                    system: "http://snomed.info/sct",
                    code: typeCode,
                    display: typeDisplay
                }]
            }],
            subject: {
                reference: `Patient/${patientId}`
            },
            period: {
                start: new Date().toISOString()
            }
        };

        return await this.fetchFHIR('/Encounter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(encResource)
        });
    },

    async deleteEncounter(id) {
        return await this.fetchFHIR(`/Encounter/${id}`, {
            method: 'DELETE'
        });
    },

    async getCapabilityStatement() {
        return await this.fetchFHIR('/metadata');
    }
};

window.API = API;
