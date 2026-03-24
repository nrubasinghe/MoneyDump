const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const handleResponse = async (response) => {
    console.log(`API Response [${response.status}] from ${response.url}`);
    if (response.status === 401) {
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
    }
    if (!response.ok) {
        let errorMsg = 'Unknown error';
        try {
            const error = await response.json();
            errorMsg = error.detail || JSON.stringify(error);
        } catch (e) { }
        console.error(`API Error: ${errorMsg}`);
        throw new Error(errorMsg);
    }
    const data = await response.json();
    console.log('API Data:', data);
    return data;
};

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const authService = {
    login: async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            body: formData,
        });
        const data = await handleResponse(response);
        localStorage.setItem('token', data.access_token);
        return data;
    },
    register: (email, password) => {
        return fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        }).then(handleResponse);
    },
    getMe: () => {
        return fetch(`${API_URL}/auth/me`, {
            headers: getAuthHeaders(),
        }).then(handleResponse);
    },
    logout: () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
};

export const transactionService = {
    getTransactions: (params = {}) => {
        // Filter out undefined, null, or empty string values
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );
        const query = new URLSearchParams(cleanParams).toString();
        const url = `${API_URL}/transactions/${query ? `?${query}` : ''}`;
        console.log(`FETCH: GET ${url}`);
        return fetch(url, { headers: getAuthHeaders() }).then(handleResponse);
    },
    createTransaction: (data) => {
        console.log(`FETCH: POST ${API_URL}/transactions/`, data);
        return fetch(`${API_URL}/transactions/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse);
    },
    deleteTransaction: (id) => {
        console.log(`FETCH: DELETE ${API_URL}/transactions/${id}`);
        return fetch(`${API_URL}/transactions/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        }).then(handleResponse);
    },
};

export const budgetService = {
    getBudgets: () => {
        console.log(`FETCH: GET ${API_URL}/budgets/`);
        return fetch(`${API_URL}/budgets/`, { headers: getAuthHeaders() }).then(handleResponse);
    },
    createBudget: (data) => {
        console.log(`FETCH: POST ${API_URL}/budgets/`, data);
        return fetch(`${API_URL}/budgets/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse);
    },
    deleteBudget: (id) => {
        console.log(`FETCH: DELETE ${API_URL}/budgets/${id}`);
        return fetch(`${API_URL}/budgets/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        }).then(handleResponse);
    },
};

export const goalService = {
    getGoals: () => {
        console.log(`FETCH: GET ${API_URL}/goals/`);
        return fetch(`${API_URL}/goals/`, { headers: getAuthHeaders() }).then(handleResponse);
    },
    createGoal: (data) => {
        console.log(`FETCH: POST ${API_URL}/goals/`, data);
        return fetch(`${API_URL}/goals/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse);
    },
    deleteGoal: (id) => {
        console.log(`FETCH: DELETE ${API_URL}/goals/${id}`);
        return fetch(`${API_URL}/goals/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        }).then(handleResponse);
    },
};

export const aiService = {
    processDump: (text) => fetch(`${API_URL}/ai/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text }),
    }).then(handleResponse),
    confirmDump: (data) => fetch(`${API_URL}/ai/confirm`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    }).then(handleResponse),
    getAdvice: (query) => fetch(`${API_URL}/ai/query`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ query }),
    }).then(handleResponse),
    analyze: (data) => fetch(`${API_URL}/ai/analyze`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    }).then(handleResponse),
    getReports: () => fetch(`${API_URL}/ai/reports`, { headers: getAuthHeaders() }).then(handleResponse),
    deleteReport: (id) => fetch(`${API_URL}/ai/reports/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    }).then(handleResponse),
};
