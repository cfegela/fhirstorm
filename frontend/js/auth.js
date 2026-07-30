const Auth = {
    TOKEN_KEY: 'fhirstorm_token',
    USER_KEY: 'fhirstorm_user',

    async init() {
        const savedUser = this.getUser();
        if (savedUser) {
            this.updateUI(savedUser);
        } else {
            try {
                await this.login('doctor@fhirstorm.org', 'doctor123');
            } catch (e) {
                console.error('Auto login failed:', e);
            }
        }
    },

    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Authentication failed');
            }

            const data = await response.json();
            localStorage.setItem(this.TOKEN_KEY, data.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(data));

            this.updateUI(data);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        window.location.reload();
    },

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    getUser() {
        const u = localStorage.getItem(this.USER_KEY);
        return u ? JSON.parse(u) : null;
    },

    getAuthHeaders() {
        const token = this.getToken();
        const headers = { 'Accept': 'application/fhir+json, application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    updateUI(userData) {
        const nameEl = document.getElementById('display-user-name');
        const roleEl = document.getElementById('display-user-role');
        if (nameEl) nameEl.textContent = userData.fullName || userData.username;
        if (roleEl) roleEl.textContent = (userData.role || 'GUEST').replace('ROLE_', '');
    }
};

window.Auth = Auth;
