const AISENCY_API_BASE_URL = process.env.AISENCY_API_URL || 'http://localhost:5001';

class AisensyForwardingService {
  async createBusiness(payload) {
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/create-business`;
    console.log('[wapi-api Aisensy Service] Forwarding to aisency-api:', targetUrl, 'Payload:', payload);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] Response from aisency-api:', response.status, data);

    if (!response.ok) {
      const error = new Error(data.message || 'Aisensy business creation failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async createProject(payload) {
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/create-project`;
    console.log('[wapi-api Aisensy Service] Forwarding project creation to aisency-api:', targetUrl, 'Payload:', payload);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] Project creation response:', response.status, data);

    if (!response.ok) {
      const error = new Error(data.message || 'Aisensy project creation failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async getPhoneNumbers(userId, projectId) {
    let targetUrl = `${AISENCY_API_BASE_URL}/aisensy/phone-numbers?user_id=${userId}`;
    if (projectId) targetUrl += `&projectId=${projectId}`;
    console.log('[wapi-api Aisensy Service] Forwarding getPhoneNumbers:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] getPhoneNumbers response:', response.status);

    if (!response.ok) {
      const error = new Error(data.message || 'Failed to get phone numbers');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async getPhoneNumber(userId, phoneNumberId, fields, projectId) {
    let targetUrl = `${AISENCY_API_BASE_URL}/aisensy/phone-number?user_id=${userId}`;
    if (phoneNumberId) targetUrl += `&phoneNumberId=${phoneNumberId}`;
    if (fields) targetUrl += `&fields=${fields}`;
    if (projectId) targetUrl += `&projectId=${projectId}`;
    console.log('[wapi-api Aisensy Service] Forwarding getPhoneNumber:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] getPhoneNumber response:', response.status);

    if (!response.ok) {
      const error = new Error(data.message || 'Failed to get phone number');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async getDisplayNameStatus(userId, phoneNumberId, projectId) {
    let targetUrl = `${AISENCY_API_BASE_URL}/aisensy/display-name-status?user_id=${userId}`;
    if (phoneNumberId) targetUrl += `&phoneNumberId=${phoneNumberId}`;
    if (projectId) targetUrl += `&projectId=${projectId}`;
    console.log('[wapi-api Aisensy Service] Forwarding getDisplayNameStatus:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] getDisplayNameStatus response:', response.status);

    if (!response.ok) {
      const error = new Error(data.message || 'Failed to get display name status');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async getProjectsByBusiness(userId, businessEmail = null) {
    let targetUrl = `${AISENCY_API_BASE_URL}/aisensy/projects?user_id=${userId}`;
    if (businessEmail) targetUrl += `&business_email=${encodeURIComponent(businessEmail)}`;
    console.log('[wapi-api Aisensy Service] Forwarding getProjectsByBusiness:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] getProjectsByBusiness response:', response.status);

    if (!response.ok) {
      const error = new Error(data.message || 'Failed to get projects');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async sendMessage(payload) {
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/messages`;
    console.log('[wapi-api Aisensy Service] Forwarding sendMessage:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] sendMessage response:', response.status);

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Failed to send message');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async createCatalog(payload) {
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/catalog`;
    console.log('[wapi-api Aisensy Service] Forwarding createCatalog:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] createCatalog response:', response.status);

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Failed to create catalog');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async getCatalog(query = {}) {
    const { before, after, fields } = query;
    let targetUrl = `${AISENCY_API_BASE_URL}/aisensy/catalog`;
    const params = new URLSearchParams();
    if (before) params.append('before', before);
    if (after) params.append('after', after);
    if (fields) params.append('fields', fields);
    const queryString = params.toString();
    if (queryString) targetUrl += `?${queryString}`;

    console.log('[wapi-api Aisensy Service] Forwarding getCatalog:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] getCatalog response:', response.status);

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Failed to fetch catalogs');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async getFlows(query = {}) {
    const { fields, after, before, limit } = query;
    let targetUrl = `${AISENCY_API_BASE_URL}/aisensy/flows`;
    const params = new URLSearchParams();
    if (fields) params.append('fields', fields);
    if (after) params.append('after', after);
    if (before) params.append('before', before);
    if (limit) params.append('limit', limit);
    const queryString = params.toString();
    if (queryString) targetUrl += `?${queryString}`;

    console.log('[wapi-api Aisensy Service] Forwarding getFlows:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] getFlows response:', response.status);

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Failed to fetch flows');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }
}

export default new AisensyForwardingService();
