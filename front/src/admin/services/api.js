// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// API Client with credentials for cookie-based auth
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Important for cookies!
    };

    try {
      const response = await fetch(url, config);

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Request failed with status ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request("/auth/logout", {
      method: "POST",
    });
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Inquiry endpoints
  async getInquiries(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.assignedTo) params.append("assignedTo", filters.assignedTo);
    if (filters.search) params.append("search", filters.search);
    if (filters.source) params.append("source", filters.source);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const queryString = params.toString();
    return this.request(`/inquiries${queryString ? `?${queryString}` : ""}`);
  }

  async createInquiry(inquiryData) {
    return this.request("/inquiries/manual", {
      method: "POST",
      body: JSON.stringify(inquiryData),
    });
  }

  async getInquiryById(id) {
    return this.request(`/inquiries/${id}`);
  }

  async updateInquiry(id, data) {
    return this.request(`/inquiries/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async assignInquiry(inquiryId, assignedTo) {
    return this.request(`/inquiries/${inquiryId}/assign`, {
      method: "POST",
      body: JSON.stringify({ assignedTo }),
    });
  }

  async convertInquiryToLead(inquiryId, serviceDetails = {}) {
    return this.request(`/inquiries/${inquiryId}/convert-to-lead`, {
      method: "POST",
      body: JSON.stringify(serviceDetails),
    });
  }

  async deleteInquiry(id) {
    return this.request(`/inquiries/${id}`, {
      method: "DELETE",
    });
  }

  // Lead endpoints
  async getLeads(filters = {}) {
    const params = new URLSearchParams();
    if (filters.isClaimed !== undefined) params.append("isClaimed", filters.isClaimed);
    if (filters.claimedBy) params.append("claimedBy", filters.claimedBy);
    if (filters.serviceType) params.append("serviceType", filters.serviceType);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const queryString = params.toString();
    return this.request(`/leads${queryString ? `?${queryString}` : ""}`);
  }

  async createLead(data) {
    return this.request("/leads", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLeadById(id) {
    return this.request(`/leads/${id}`);
  }

  async updateLead(id, data) {
    return this.request(`/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async claimLead(id) {
    return this.request(`/leads/${id}/claim`, {
      method: "POST",
    });
  }

  async deleteLead(id) {
    return this.request(`/leads/${id}`, {
      method: "DELETE",
    });
  }

  // Potential endpoints
  async getPotentials() {
    return this.request("/potentials");
  }

  async createPotential(data) {
    return this.request("/potentials", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getPotentialById(id) {
    return this.request(`/potentials/${id}`);
  }

  async updatePotential(id, data) {
    return this.request(`/potentials/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deletePotential(id) {
    return this.request(`/potentials/${id}`, {
      method: "DELETE",
    });
  }

  // Client endpoints
  async getClients() {
    return this.request("/clients");
  }

  async createClient(data) {
    return this.request("/clients", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getClientById(id) {
    return this.request(`/clients/${id}`);
  }

  async updateClient(id, data) {
    return this.request(`/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id) {
    return this.request(`/clients/${id}`, {
      method: "DELETE",
    });
  }

  // User endpoints
  async getUsers(role = "sales") {
    const params = new URLSearchParams();
    if (role) params.append("role", role);

    const queryString = params.toString();
    return this.request(`/users${queryString ? `?${queryString}` : ""}`);
  }

  // Service Request endpoints
  async getServiceRequestsByLeadId(leadId) {
    return this.request(`/service-requests/lead/${leadId}`);
  }

  async getServiceRequestById(id) {
    return this.request(`/service-requests/${id}`);
  }

  async createServiceRequest(data) {
    return this.request("/service-requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateServiceRequest(id, data) {
    return this.request(`/service-requests/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteServiceRequest(id) {
    return this.request(`/service-requests/${id}`, {
      method: "DELETE",
    });
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
