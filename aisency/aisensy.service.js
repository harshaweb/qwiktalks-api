const AISENCY_API_BASE_URL = process.env.AISENCY_API_URL || 'http://localhost:5001';

class AisensyForwardingService {
  async getBusiness(userId) {
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/waba-info?user_id=${userId}`;
    console.log('[wapi-api Aisensy Service] Forwarding getBusiness:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] getBusiness response:', response.status, data);

    return data;
  }

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
    console.log('[wapi-api Aisensy Service] Forwarding sendMessage:', targetUrl, 'Payload:', JSON.stringify(payload));

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] sendMessage response:', response.status, JSON.stringify(data));

    // Check if the response indicates success in the data, even if HTTP status is not ok
    if (data.success === true) {
      console.log('[wapi-api Aisensy Service] Message sent successfully (data.success=true)');
      return data;
    }

    // If response is not ok and data doesn't indicate success, throw error
    if (!response.ok) {
      console.error('[wapi-api Aisensy Service] sendMessage failed:', response.status, data);
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

  async createProduct(payload) {
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/product`;
    console.log('[wapi-api Aisensy Service] Forwarding createProduct:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] createProduct response:', response.status);

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Failed to create product');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async getProducts(catalogId, before, after) {
    const params = new URLSearchParams();
    if (catalogId) params.append('catalogId', catalogId);
    if (before) params.append('before', before);
    if (after) params.append('after', after);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/product${queryString}`;
    console.log('[wapi-api Aisensy Service] Forwarding getProducts:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] getProducts response:', response.status);

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Failed to get products');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async uploadMedia(fileBuffer, originalname, mimetype) {
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/media`;
    console.log('[wapi-api Aisensy Service] Forwarding uploadMedia:', targetUrl);

    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimetype });
    formData.append('file', blob, originalname);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: formData
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] uploadMedia response:', response.status, data);

    if (!response.ok) {
      const error = new Error(data.error || data.message || 'Failed to upload media to AiSensy');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async createWaTemplate(payload) {
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/wa-template`;
    console.log('[wapi-api Aisensy Service] Forwarding createWaTemplate');

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || data.message || 'Failed to create template');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  async getTemplates(query = {}) {
    const params = new URLSearchParams();
    if (query.fields) params.append('fields', query.fields);
    if (query.limit) params.append('limit', query.limit);
    if (query.after) params.append('after', query.after);
    if (query.before) params.append('before', query.before);
    const queryString = params.toString();
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/templates${queryString ? `?${queryString}` : ''}`;
    console.log('[wapi-api Aisensy Service] Forwarding getTemplates');

    const response = await fetch(targetUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || data.message || 'Failed to get templates');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  async getTemplate(templateId) {
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/template/${templateId}`;
    console.log('[wapi-api Aisensy Service] Forwarding getTemplate:', templateId);

    const response = await fetch(targetUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || data.message || 'Failed to get template');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  async editTemplate(templateId, payload) {
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/edit-template/${templateId}`;
    console.log('[wapi-api Aisensy Service] Forwarding editTemplate:', templateId);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || data.message || 'Failed to edit template');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  async deleteWaTemplate(name, hsm_id) {
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (hsm_id) params.append('hsm_id', hsm_id);
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/wa-template?${params.toString()}`;
    console.log('[wapi-api Aisensy Service] Forwarding deleteWaTemplate');

    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || data.message || 'Failed to delete template');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  async deleteMedia(id) {
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/media`;
    console.log('[wapi-api Aisensy Service] Forwarding deleteMedia, id:', id);

    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id })
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] deleteMedia response:', response.status);

    if (!response.ok) {
      const error = new Error(data.error || data.message || 'Failed to delete media from AiSensy');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async submitFacebookAccessToken(payload) {
    const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/submit-facebook-access-token`;
    console.log('[wapi-api Aisensy Service] Forwarding submitFacebookAccessToken:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('[wapi-api Aisensy Service] submitFacebookAccessToken response:', response.status);

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Failed to submit Facebook access token');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }
}

export default new AisensyForwardingService();
