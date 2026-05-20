(function attachRecruitPlusApi(global) {
  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const API_BASE_URL = global.API_BASE_URL || (isLocalhost && window.location.port !== '8000' ? 'http://localhost:8000' : '');

  function getCurrentUserHeaders() {
    const currentUser = global.DB?.getCurrentUser?.();
    return {
      'X-User-Name': currentUser?.name || '',
      'X-User-Email': currentUser?.email || '',
      'X-User-Role': currentUser?.role || '',
    };
  }

  async function apiRequest(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers: {
        ...(isFormData ? {} : {'Content-Type': 'application/json'}),
        ...getCurrentUserHeaders(),
        ...(options.headers || {}),
      },
      body: options.body
        ? (isFormData ? options.body : JSON.stringify(options.body))
        : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `API request failed: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  const api = {
    API_BASE_URL,
    apiRequest,
    getCandidates() {
      return apiRequest('/api/candidates');
    },
    getCandidate(id) {
      return apiRequest(`/api/candidates/${id}`);
    },
    createCandidate(payload) {
      return apiRequest('/api/candidates', {method: 'POST', body: payload});
    },
    updateCandidate(id, payload) {
      return apiRequest(`/api/candidates/${id}`, {method: 'PUT', body: payload});
    },
    changeCandidateStatus(id, status) {
      return apiRequest(`/api/candidates/${id}/status`, {method: 'PATCH', body: {status}});
    },
    changeCandidateStage(id, stage) {
      return apiRequest(`/api/candidates/${id}/stage`, {method: 'PATCH', body: {stage}});
    },
    archiveCandidate(id) {
      return apiRequest(`/api/candidates/${id}/archive`, {method: 'PATCH', body: {}});
    },
    getDocuments() {
      return apiRequest('/api/documents');
    },
    uploadDocument(formData) {
      return apiRequest('/api/documents/upload', {method: 'POST', body: formData});
    },
    updateDocumentStatus(id, status) {
      return apiRequest(`/api/documents/${id}/status`, {method: 'PATCH', body: {status}});
    },
    deleteDocument(id) {
      return apiRequest(`/api/documents/${id}`, {method: 'DELETE'});
    },
    getUsers() {
      return apiRequest('/api/users');
    },
    createUser(payload) {
      return apiRequest('/api/users', {method: 'POST', body: payload});
    },
    updateUser(id, payload) {
      return apiRequest(`/api/users/${id}`, {method: 'PUT', body: payload});
    },
    deactivateUser(id, status) {
      return apiRequest(`/api/users/${id}/deactivate`, {method: 'PATCH', body: {status}});
    },
    getLogs() {
      return apiRequest('/api/logs');
    },
    exportLogs() {
      return apiRequest('/api/logs/export');
    },
    createLog(payload) {
      return apiRequest('/api/logs', {method: 'POST', body: payload});
    },
    getAnalyticsDashboard() {
      return apiRequest('/api/analytics/dashboard');
    },
    getStatusDistribution() {
      return apiRequest('/api/analytics/status-distribution');
    },
    getRegistrationDynamics() {
      return apiRequest('/api/analytics/registration-dynamics');
    },
    getRecruiterAnalytics() {
      return apiRequest('/api/analytics/recruiters');
    },
    getRoleMatrix() {
      return apiRequest('/api/roles/matrix');
    },
    getRoles() {
      return apiRequest('/api/roles');
    },
    getPermissions() {
      return apiRequest('/api/roles/permissions');
    },
    updateRolePermissions(roleId, permissionName, allowed) {
      return apiRequest(`/api/roles/${encodeURIComponent(roleId)}/permissions`, {
        method: 'PUT',
        body: {permissionName, allowed},
      });
    },
    getSettings() {
      return apiRequest('/api/settings');
    },
    updateSettings(payload) {
      return apiRequest('/api/settings', {method: 'PUT', body: payload});
    },
  };

  global.RecruitPlusApi = api;
})(window);
