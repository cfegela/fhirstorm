/**
 * Escapes a string for safe insertion into HTML to prevent XSS.
 * All dynamic values from the FHIR API must be passed through this
 * before being used in innerHTML template literals.
 */
function escapeHtml(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
}

document.addEventListener('DOMContentLoaded', async () => {
    await Auth.init();
    App.init();
});

const App = {
    currentPatients: [],
    selectedPatient: null,

    async init() {
        this.bindEvents();
        await this.loadPatients();
    },

    bindEvents() {
        // Navigation Tabs
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Global Search
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterPatients(e.target.value);
            });
        }

        // Back to Patients Button
        const backBtn = document.getElementById('btn-back-to-patients');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.switchTab('patients');
            });
        }

        // Add buttons on Patient Detail view
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-obs-for-patient-btn')) {
                this.openModalForPatient('modal-new-obs', 'obs-patient-select');
            } else if (e.target.closest('.add-cond-for-patient-btn')) {
                this.openModalForPatient('modal-new-condition', 'cond-patient-select');
            } else if (e.target.closest('.add-med-for-patient-btn')) {
                this.openModalForPatient('modal-new-medication', 'med-patient-select');
            } else if (e.target.closest('.add-enc-for-patient-btn')) {
                this.openModalForPatient('modal-new-encounter', 'enc-patient-select');
            }
        });

        // Modals setup
        this.setupModals();

        // View Action Buttons
        const newMedViewBtn = document.getElementById('btn-new-med-view');
        if (newMedViewBtn) {
            newMedViewBtn.addEventListener('click', () => {
                this.populatePatientDropdown('med-patient-select');
                document.getElementById('modal-new-medication').classList.add('show');
            });
        }

        const newEncViewBtn = document.getElementById('btn-new-enc-view');
        if (newEncViewBtn) {
            newEncViewBtn.addEventListener('click', () => {
                this.populatePatientDropdown('enc-patient-select');
                document.getElementById('modal-new-encounter').classList.add('show');
            });
        }

        // FHIR Inspector Execute
        const fetchJsonBtn = document.getElementById('btn-fetch-json');
        if (fetchJsonBtn) {
            fetchJsonBtn.addEventListener('click', () => this.runFhirInspector());
        }
    },

    switchTab(tabName) {
        document.querySelectorAll('.nav-item').forEach(i => {
            i.classList.toggle('active', i.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-view').forEach(view => {
            view.style.display = 'none';
        });

        const targetView = document.getElementById(`view-${tabName}`);
        if (targetView) {
            targetView.style.display = 'block';
        }

        if (tabName === 'patients') this.loadPatients();
        if (tabName === 'clinical') this.loadClinicalView();
        if (tabName === 'medications') this.loadMedicationsView();
        if (tabName === 'encounters') this.loadEncountersView();
        if (tabName === 'capabilities') this.loadCapabilitiesView();
    },

    setupModals() {
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('show');
            });
        });

        // New Patient Modal
        const newPatientBtn = document.getElementById('btn-new-patient');
        const modalNewPatient = document.getElementById('modal-new-patient');
        if (newPatientBtn && modalNewPatient) {
            newPatientBtn.addEventListener('click', () => modalNewPatient.classList.add('show'));
        }

        const formNewPatient = document.getElementById('form-new-patient');
        if (formNewPatient) {
            formNewPatient.addEventListener('submit', async (e) => {
                e.preventDefault();
                const given = document.getElementById('patient-given').value;
                const family = document.getElementById('patient-family').value;
                const gender = document.getElementById('patient-gender').value;
                const dob = document.getElementById('patient-dob').value;
                const phone = document.getElementById('patient-phone').value;
                const email = document.getElementById('patient-email').value;

                try {
                    await API.createPatient(given, family, gender, dob, phone, email);
                    modalNewPatient.classList.remove('show');
                    formNewPatient.reset();
                    await this.loadPatients();
                } catch (err) {
                    alert('Failed to create patient: ' + err.message);
                }
            });
        }

        // New Observation Modal
        const newObsBtn = document.getElementById('btn-new-obs');
        const modalNewObs = document.getElementById('modal-new-obs');
        if (newObsBtn && modalNewObs) {
            newObsBtn.addEventListener('click', () => {
                this.populatePatientDropdown('obs-patient-select');
                modalNewObs.classList.add('show');
            });
        }

        const formNewObs = document.getElementById('form-new-obs');
        if (formNewObs) {
            formNewObs.addEventListener('submit', async (e) => {
                e.preventDefault();
                const patientId = document.getElementById('obs-patient-select').value;
                const obsType = document.getElementById('obs-type-select').value.split('|');
                const value = document.getElementById('obs-value').value;

                try {
                    await API.createObservation(patientId, obsType[0], obsType[1], obsType[2], value);
                    modalNewObs.classList.remove('show');
                    if (this.selectedPatient && this.selectedPatient.id === patientId) {
                        this.loadPatientDetails(patientId);
                    } else {
                        this.loadClinicalView();
                    }
                } catch (err) {
                    alert('Failed to record observation: ' + err.message);
                }
            });
        }

        // New Condition Modal
        const modalNewCondition = document.getElementById('modal-new-condition');
        const formNewCondition = document.getElementById('form-new-condition');
        if (formNewCondition) {
            formNewCondition.addEventListener('submit', async (e) => {
                e.preventDefault();
                const patientId = document.getElementById('cond-patient-select').value;
                const condType = document.getElementById('cond-type-select').value.split('|');

                try {
                    await API.createCondition(patientId, condType[0], condType[1]);
                    modalNewCondition.classList.remove('show');
                    if (this.selectedPatient && this.selectedPatient.id === patientId) {
                        this.loadPatientDetails(patientId);
                    }
                } catch (err) {
                    alert('Failed to record condition: ' + err.message);
                }
            });
        }

        // New Medication Modal
        const modalNewMedication = document.getElementById('modal-new-medication');
        const formNewMedication = document.getElementById('form-new-medication');
        if (formNewMedication) {
            formNewMedication.addEventListener('submit', async (e) => {
                e.preventDefault();
                const patientId = document.getElementById('med-patient-select').value;
                const medType = document.getElementById('med-type-select').value.split('|');

                try {
                    await API.createMedicationRequest(patientId, medType[0], medType[1]);
                    modalNewMedication.classList.remove('show');
                    if (this.selectedPatient && this.selectedPatient.id === patientId) {
                        this.loadPatientDetails(patientId);
                    } else {
                        this.loadMedicationsView();
                    }
                } catch (err) {
                    alert('Failed to create medication request: ' + err.message);
                }
            });
        }

        // New Encounter Modal
        const modalNewEncounter = document.getElementById('modal-new-encounter');
        const formNewEncounter = document.getElementById('form-new-encounter');
        if (formNewEncounter) {
            formNewEncounter.addEventListener('submit', async (e) => {
                e.preventDefault();
                const patientId = document.getElementById('enc-patient-select').value;
                const encClass = document.getElementById('enc-class-select').value.split('|');
                const encType = document.getElementById('enc-type-select').value.split('|');

                try {
                    await API.createEncounter(patientId, encClass[0], encClass[1], encType[0], encType[1]);
                    modalNewEncounter.classList.remove('show');
                    if (this.selectedPatient && this.selectedPatient.id === patientId) {
                        this.loadPatientDetails(patientId);
                    } else {
                        this.loadEncountersView();
                    }
                } catch (err) {
                    alert('Failed to create encounter: ' + err.message);
                }
            });
        }
    },

    openModalForPatient(modalId, selectId) {
        this.populatePatientDropdown(selectId);
        if (this.selectedPatient) {
            document.getElementById(selectId).value = this.selectedPatient.id;
        }
        document.getElementById(modalId).classList.add('show');
    },

    populatePatientDropdown(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = this.currentPatients.map(p => {
            const family = escapeHtml(p.name?.[0]?.family || '');
            const given = escapeHtml(p.name?.[0]?.given?.[0] || '');
            const id = escapeHtml(p.id);
            return `<option value="${id}">${given} ${family} (${id})</option>`;
        }).join('');
    },

    async loadPatients() {
        try {
            this.currentPatients = await API.getPatients();
            this.renderPatientsGrid(this.currentPatients);
        } catch (err) {
            console.error('Error loading patients:', err);
        }
    },

    renderPatientsGrid(patients) {
        const grid = document.getElementById('patients-grid');
        if (!grid) return;

        if (patients.length === 0) {
            grid.innerHTML = `<div class="card" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No FHIR Patient resources found.</div>`;
            return;
        }

        grid.innerHTML = patients.map(p => {
            const family = escapeHtml(p.name?.[0]?.family || 'N/A');
            const given = escapeHtml(p.name?.[0]?.given?.join(' ') || '');
            const fullName = `${given} ${family}`.trim();
            const gender = escapeHtml(p.gender || 'Unknown');
            const dob = escapeHtml(p.birthDate || 'N/A');
            const phone = escapeHtml(p.telecom?.find(t => t.system === 'phone')?.value || 'Not provided');
            const email = escapeHtml(p.telecom?.find(t => t.system === 'email')?.value || 'Not provided');
            // IDs are used in onclick attributes — escape for JS string safety
            const safeId = encodeURIComponent(p.id);

            return `
                <div class="patient-card" onclick="App.openPatientDetail('${safeId}')">
                    <div class="card-body-content">
                        <h3 class="patient-name-h3">${fullName}</h3>
                        <div class="patient-meta-list">
                            <div class="patient-meta-item">
                                <i class="fa-solid fa-venus-mars"></i> Sex: ${gender.charAt(0).toUpperCase() + gender.slice(1)}
                            </div>
                            <div class="patient-meta-item">
                                <i class="fa-solid fa-calendar"></i> DOB: ${dob}
                            </div>
                            <div class="patient-meta-item">
                                <i class="fa-solid fa-phone"></i> ${phone}
                            </div>
                            <div class="patient-meta-item">
                                <i class="fa-solid fa-envelope"></i> ${email}
                            </div>
                        </div>
                    </div>
                    <div class="patient-card-footer">
                        <button class="btn btn-sm btn-outline" style="width: 100%;" onclick="event.stopPropagation(); App.openPatientDetail('${safeId}')">
                            <i class="fa-solid fa-folder-open"></i> Open Chart
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    filterPatients(query) {
        const q = query.toLowerCase();
        const filtered = this.currentPatients.filter(p => {
            const name = (p.name?.[0]?.family + ' ' + p.name?.[0]?.given?.join(' ')).toLowerCase();
            const mrn = (p.identifier?.[0]?.value || '').toLowerCase();
            return name.includes(q) || mrn.includes(q) || p.id.toLowerCase().includes(q);
        });
        this.renderPatientsGrid(filtered);
    },

    filterByGender(gender) {
        if (gender === 'all') {
            this.renderPatientsGrid(this.currentPatients);
        } else {
            const filtered = this.currentPatients.filter(p => (p.gender || '').toLowerCase() === gender);
            this.renderPatientsGrid(filtered);
        }
    },

    async openPatientDetail(patientId) {
        try {
            this.selectedPatient = await API.getPatientById(patientId);
            this.switchTab('patient-detail');
            await this.loadPatientDetails(patientId);
        } catch (err) {
            alert('Failed to load patient detail: ' + err.message);
        }
    },

    async loadPatientDetails(patientId) {
        const p = this.selectedPatient;
        const family = p.name?.[0]?.family || 'N/A';
        const given = p.name?.[0]?.given?.join(' ') || '';
        const fullName = `${given} ${family}`.trim();
        const mrn = p.identifier?.[0]?.value || `MRN-${p.id}`;

        const gender = p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : 'N/A';
        const dob = p.birthDate || 'N/A';
        const phone = p.telecom?.find(t => t.system === 'phone')?.value || 'Not provided';
        const email = p.telecom?.find(t => t.system === 'email')?.value || 'Not provided';

        const safePatientId = encodeURIComponent(p.id);

        // Render Banner — escape all values from API before inserting into innerHTML
        const banner = document.getElementById('patient-banner');
        banner.innerHTML = `
            <div class="patient-banner-info">
                <div class="patient-avatar-large"><i class="fa-solid fa-user-injured"></i></div>
                <div class="banner-details">
                    <h2>${escapeHtml(fullName)}</h2>
                    <div class="banner-details-list">
                        <div class="banner-detail-item"><i class="fa-solid fa-id-card"></i> <strong>MRN:</strong> ${escapeHtml(mrn)}</div>
                        <div class="banner-detail-item"><i class="fa-solid fa-venus-mars"></i> <strong>Sex:</strong> ${escapeHtml(gender)}</div>
                        <div class="banner-detail-item"><i class="fa-solid fa-calendar"></i> <strong>DOB:</strong> ${escapeHtml(dob)}</div>
                        <div class="banner-detail-item"><i class="fa-solid fa-phone"></i> <strong>Phone:</strong> ${escapeHtml(phone)}</div>
                        <div class="banner-detail-item"><i class="fa-solid fa-envelope"></i> <strong>Email:</strong> ${escapeHtml(email)}</div>
                        <div class="banner-detail-item"><i class="fa-solid fa-hashtag"></i> <strong>FHIR ID:</strong> ${escapeHtml(p.id)}</div>
                    </div>
                </div>
            </div>
        `;

        // Render Actions Footer Beneath Resource Cards
        const actionsFooter = document.getElementById('patient-detail-actions');
        if (actionsFooter) {
            actionsFooter.innerHTML = `
                <button class="btn btn-secondary" onclick="App.runFhirInspectorFor('${safePatientId}')">
                    <i class="fa-solid fa-code"></i> Inspect Raw FHIR JSON
                </button>
                <button class="btn btn-danger" onclick="App.deletePatient('${safePatientId}', true)">
                    <i class="fa-solid fa-trash-can"></i> Delete Patient
                </button>
            `;
        }

        // Fetch parallel FHIR sub-resources
        const [observations, conditions, medications, encounters] = await Promise.all([
            API.getObservations(patientId),
            API.getConditions(patientId),
            API.getMedicationRequests(patientId),
            API.getEncounters(patientId)
        ]);

        // Render Vitals
        const vitalsContainer = document.getElementById('patient-vitals-container');
        if (observations.length === 0) {
            vitalsContainer.innerHTML = `<p class="text-sm">No vital observations recorded yet.</p>`;
        } else {
            vitalsContainer.innerHTML = observations.map(o => {
                const title = o.code?.coding?.[0]?.display || o.code?.text || 'Observation';
                let valStr = 'N/A';
                let unitStr = '';
                if (o.valueQuantity) {
                    valStr = o.valueQuantity.value;
                    unitStr = o.valueQuantity.unit || '';
                } else if (o.component) {
                    valStr = o.component.map(c => c.valueQuantity?.value).join('/');
                    unitStr = o.component[0]?.valueQuantity?.unit || '';
                }
                return `
                    <div class="vital-card">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div class="vital-title">${escapeHtml(title)}</div>
                            <button class="btn btn-sm btn-ghost text-danger" title="Delete Observation" onclick="App.deleteObservation('${encodeURIComponent(o.id)}', '${safePatientId}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                        <div class="vital-value">${escapeHtml(valStr)}</div>
                        <div class="vital-unit">${escapeHtml(unitStr)}</div>
                    </div>
                `;
            }).join('');
        }

        // Render Conditions
        const condContainer = document.getElementById('patient-conditions-container');
        if (conditions.length === 0) {
            condContainer.innerHTML = `<p class="text-sm">No active conditions reported.</p>`;
        } else {
            condContainer.innerHTML = conditions.map(c => `
                <div class="list-item">
                    <div>
                        <div class="list-item-title">${escapeHtml(c.code?.coding?.[0]?.display || 'Condition')}</div>
                        <div class="list-item-sub">SNOMED: ${escapeHtml(c.code?.coding?.[0]?.code || 'N/A')}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <span class="badge-status badge-active">ACTIVE</span>
                        <button class="btn btn-sm btn-ghost text-danger" title="Delete Condition" onclick="App.deleteCondition('${encodeURIComponent(c.id)}', '${safePatientId}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Render Medications
        const medContainer = document.getElementById('patient-medications-container');
        if (medications.length === 0) {
            medContainer.innerHTML = `<p class="text-sm">No active prescriptions.</p>`;
        } else {
            medContainer.innerHTML = medications.map(m => `
                <div class="list-item">
                    <div>
                        <div class="list-item-title">${escapeHtml(m.medicationCodeableConcept?.coding?.[0]?.display || 'Medication')}</div>
                        <div class="list-item-sub">RxNorm: ${escapeHtml(m.medicationCodeableConcept?.coding?.[0]?.code || 'N/A')}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <span class="badge-status badge-active">${escapeHtml((m.status || 'ACTIVE').toUpperCase())}</span>
                        <button class="btn btn-sm btn-ghost text-danger" title="Delete Prescription" onclick="App.deleteMedication('${encodeURIComponent(m.id)}', '${safePatientId}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Render Encounters
        const encContainer = document.getElementById('patient-encounters-container');
        if (encounters.length === 0) {
            encContainer.innerHTML = `<p class="text-sm">No encounters recorded.</p>`;
        } else {
            encContainer.innerHTML = encounters.map(e => `
                <div class="timeline-item" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div class="list-item-title">${escapeHtml(e.type?.[0]?.coding?.[0]?.display || 'Ambulatory Consultation')}</div>
                        <div class="list-item-sub">Class: ${escapeHtml(e.class?.display || e.class?.code || 'Outpatient')} | Status: ${escapeHtml(e.status)}</div>
                    </div>
                    <button class="btn btn-sm btn-ghost text-danger" title="Delete Encounter" onclick="App.deleteEncounter('${encodeURIComponent(e.id)}', '${safePatientId}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
    },

    // Delete Operations
    async deletePatient(patientId, redirectToList = false) {
        if (!confirm('Are you sure you want to delete this Patient?')) return;
        try {
            await API.deletePatient(patientId);
            if (redirectToList) {
                this.switchTab('patients');
            }
            await this.loadPatients();
        } catch (err) {
            alert('Failed to delete patient: ' + err.message);
        }
    },

    async deleteObservation(obsId, patientId = null) {
        if (!confirm('Are you sure you want to delete this Observation?')) return;
        try {
            await API.deleteObservation(obsId);
            if (patientId) {
                this.loadPatientDetails(patientId);
            } else {
                this.loadClinicalView();
            }
        } catch (err) {
            alert('Failed to delete observation: ' + err.message);
        }
    },

    async deleteCondition(condId, patientId = null) {
        if (!confirm('Are you sure you want to delete this Condition?')) return;
        try {
            await API.deleteCondition(condId);
            if (patientId) {
                this.loadPatientDetails(patientId);
            }
        } catch (err) {
            alert('Failed to delete condition: ' + err.message);
        }
    },

    async deleteMedication(medId, patientId = null) {
        if (!confirm('Are you sure you want to delete this Prescription?')) return;
        try {
            await API.deleteMedicationRequest(medId);
            if (patientId) {
                this.loadPatientDetails(patientId);
            } else {
                this.loadMedicationsView();
            }
        } catch (err) {
            alert('Failed to delete medication request: ' + err.message);
        }
    },

    async deleteEncounter(encId, patientId = null) {
        if (!confirm('Are you sure you want to delete this Encounter?')) return;
        try {
            await API.deleteEncounter(encId);
            if (patientId) {
                this.loadPatientDetails(patientId);
            } else {
                this.loadEncountersView();
            }
        } catch (err) {
            alert('Failed to delete encounter: ' + err.message);
        }
    },

    formatDateTime(dateStr) {
        if (!dateStr) return 'N/A';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    },

    getPatientNameFromReference(ref) {
        if (!ref) return 'N/A';
        const patientId = ref.startsWith('Patient/') ? ref.substring(8) : ref;
        const p = this.currentPatients.find(item => item.id === patientId);
        if (!p) return ref;
        const family = p.name?.[0]?.family || '';
        const given = p.name?.[0]?.given?.join(' ') || '';
        const fullName = `${given} ${family}`.trim();
        return fullName || ref;
    },

    async loadClinicalView() {
        try {
            if (this.currentPatients.length === 0) {
                await this.loadPatients();
            }
            const obsList = await API.getObservations();
            const stats = document.getElementById('stats-overview');
            stats.innerHTML = `
                <div class="vital-card">
                    <div class="vital-title">Total FHIR Observations</div>
                    <div class="vital-value">${obsList.length}</div>
                </div>
            `;

            const tbody = document.querySelector('#observations-table tbody');
            tbody.innerHTML = obsList.map(o => {
                const patientName = this.getPatientNameFromReference(o.subject?.reference);
                const formattedDate = this.formatDateTime(o.effectiveDateTime);
                return `
                    <tr>
                        <td><code>${o.id}</code></td>
                        <td><strong>${patientName}</strong></td>
                        <td>${o.code?.coding?.[0]?.display || 'Observation'} (${o.code?.coding?.[0]?.code || ''})</td>
                        <td><strong>${o.valueQuantity ? o.valueQuantity.value + ' ' + (o.valueQuantity.unit || '') : 'See details'}</strong></td>
                        <td><span class="badge-status badge-active">${o.status}</span></td>
                        <td>${formattedDate}</td>
                        <td>
                            <button class="btn btn-sm btn-ghost text-danger" title="Delete" onclick="App.deleteObservation('${o.id}')">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            console.error(err);
        }
    },

    async loadMedicationsView() {
        if (this.currentPatients.length === 0) {
            await this.loadPatients();
        }
        const meds = await API.getMedicationRequests();
        const tbody = document.querySelector('#medications-table tbody');
        tbody.innerHTML = meds.map(m => {
            const patientName = this.getPatientNameFromReference(m.subject?.reference);
            const formattedDate = this.formatDateTime(m.authoredOn);
            return `
                <tr>
                    <td><code>${m.id}</code></td>
                    <td><strong>${patientName}</strong></td>
                    <td>${m.medicationCodeableConcept?.coding?.[0]?.display || 'Medication'}</td>
                    <td>${m.intent || 'order'}</td>
                    <td><span class="badge-status badge-active">${m.status}</span></td>
                    <td>${formattedDate}</td>
                    <td>
                        <button class="btn btn-sm btn-ghost text-danger" title="Delete" onclick="App.deleteMedication('${m.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async loadEncountersView() {
        if (this.currentPatients.length === 0) {
            await this.loadPatients();
        }
        const encs = await API.getEncounters();
        const tbody = document.querySelector('#encounters-table tbody');
        tbody.innerHTML = encs.map(e => {
            const patientName = this.getPatientNameFromReference(e.subject?.reference);
            return `
                <tr>
                    <td><code>${e.id}</code></td>
                    <td><strong>${patientName}</strong></td>
                    <td>${e.class?.display || e.class?.code || 'Ambulatory'}</td>
                    <td>${e.type?.[0]?.coding?.[0]?.display || 'Consultation'}</td>
                    <td><span class="badge-status badge-active">${e.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-ghost text-danger" title="Delete" onclick="App.deleteEncounter('${e.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async loadCapabilitiesView() {
        try {
            const cs = await API.getCapabilityStatement();
            const grid = document.getElementById('capabilities-grid');
            grid.innerHTML = `
                <div class="card">
                    <h3>Software</h3>
                    <p><strong>Name:</strong> ${cs.software?.name || 'HAPI FHIR Spring Server'}</p>
                    <p><strong>Version:</strong> ${cs.software?.version || '6.10.0'}</p>
                    <p><strong>FHIR Version:</strong> ${cs.fhirVersion || 'R4 (4.0.1)'}</p>
                    <p><strong>Publisher:</strong> FHIRStorm Healthcare</p>
                </div>
            `;
        } catch (err) {
            console.error(err);
        }
    },

    async runFhirInspector() {
        const select = document.getElementById('fhir-endpoint-select');
        const endpoint = select.value;
        const box = document.getElementById('json-display');
        box.textContent = '// Fetching FHIR R4 JSON resource...';

        try {
            const data = await API.fetchFHIR(endpoint);
            box.textContent = JSON.stringify(data, null, 2);
        } catch (err) {
            box.textContent = `// Error fetching ${endpoint}:\n` + err.message;
        }
    },

    async runFhirInspectorFor(patientId) {
        this.switchTab('inspector');
        const box = document.getElementById('json-display');
        box.textContent = '// Fetching Patient/' + patientId + '...';
        try {
            const data = await API.getPatientById(patientId);
            box.textContent = JSON.stringify(data, null, 2);
        } catch (err) {
            box.textContent = err.message;
        }
    }
};

window.App = App;
