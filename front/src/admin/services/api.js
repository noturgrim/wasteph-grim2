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
          data.message || `Request failed with status ${response.status}`,
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
    if (filters.serviceType) params.append("serviceType", filters.serviceType);
    if (filters.month) params.append("month", filters.month);
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

  async deleteInquiry(id) {
    return this.request(`/inquiries/${id}`, {
      method: "DELETE",
    });
  }

  async getInquiryNotes(inquiryId) {
    return this.request(`/inquiries/${inquiryId}/notes`);
  }

  async addInquiryNote(inquiryId, content) {
    return this.request(`/inquiries/${inquiryId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  async getInquiryTimeline(inquiryId) {
    return this.request(`/inquiries/${inquiryId}/timeline`);
  }

  // Lead endpoints
  async getLeads(filters = {}) {
    const params = new URLSearchParams();
    if (filters.isClaimed !== undefined)
      params.append("isClaimed", filters.isClaimed);
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

  async claimLead(id, source) {
    return this.request(`/leads/${id}/claim`, {
      method: "POST",
      body: JSON.stringify({ source }),
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

  async getAllUsers() {
    return this.request("/users?includeInactive=true");
  }

  async createUser(data) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: "DELETE",
    });
  }

  // Service endpoints
  async getServices() {
    return this.request("/services");
  }

  async getServiceById(id) {
    return this.request(`/services/${id}`);
  }

  async getTemplateForService(serviceId) {
    return this.request(`/services/${serviceId}/template`);
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

  // Proposal endpoints
  async getProposals(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.inquiryId) params.append("inquiryId", filters.inquiryId);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const queryString = params.toString();
    return this.request(`/proposals${queryString ? `?${queryString}` : ""}`);
  }

  async getProposalById(id) {
    return this.request(`/proposals/${id}`);
  }

  async createProposal(data) {
    return this.request("/proposals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProposal(id, data) {
    return this.request(`/proposals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async approveProposal(id, adminNotes = "") {
    return this.request(`/proposals/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ adminNotes }),
    });
  }

  async rejectProposal(id, rejectionReason) {
    return this.request(`/proposals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejectionReason }),
    });
  }

  async sendProposal(id, confirm = true) {
    return this.request(`/proposals/${id}/send`, {
      method: "POST",
      body: JSON.stringify({ confirm }),
    });
  }

  async cancelProposal(id) {
    return this.request(`/proposals/${id}/cancel`, {
      method: "POST",
    });
  }

  async previewProposalPDF(id) {
    return this.request(`/proposals/${id}/preview-pdf`, {
      method: "POST",
    });
  }

  async retryProposalEmail(id) {
    return this.request(`/proposals/${id}/retry-email`, {
      method: "POST",
    });
  }

  async downloadProposalPDF(id) {
    const url = `${this.baseURL}/proposals/${id}/pdf`;
    window.open(url, "_blank");
  }

  // Proposal Template endpoints (Master Sales only)
  async getProposalTemplates(filters = {}) {
    const params = new URLSearchParams();
    if (filters.isActive !== undefined)
      params.append("isActive", filters.isActive);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const queryString = params.toString();
    return this.request(
      `/proposal-templates${queryString ? `?${queryString}` : ""}`,
    );
  }

  async getDefaultProposalTemplate() {
    return this.request("/proposal-templates/default");
  }

  async getProposalTemplateById(id) {
    return this.request(`/proposal-templates/${id}`);
  }

  async createProposalTemplate(data) {
    return this.request("/proposal-templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProposalTemplate(id, data) {
    return this.request(`/proposal-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async setDefaultProposalTemplate(id) {
    return this.request(`/proposal-templates/${id}/set-default`, {
      method: "POST",
    });
  }

  async deleteProposalTemplate(id) {
    return this.request(`/proposal-templates/${id}`, {
      method: "DELETE",
    });
  }

  async previewProposalTemplate(templateHtml, sampleData) {
    return this.request("/proposal-templates/preview", {
      method: "POST",
      body: JSON.stringify({ templateHtml, sampleData }),
    });
  }

  async getTemplatesByCategory() {
    return this.request("/proposal-templates/by-category");
  }

  async getTemplateByType(type) {
    return this.request(`/proposal-templates/type/${type}`);
  }

  async suggestTemplateForInquiry(inquiryId) {
    return this.request(`/proposal-templates/suggest/${inquiryId}`);
  }

  // Contract endpoints
  async getContracts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const queryString = params.toString();
    return this.request(`/contracts${queryString ? `?${queryString}` : ""}`);
  }

  async getContractById(id) {
    return this.request(`/contracts/${id}`);
  }

  async requestContract(id, contractDetails, customTemplateFile = null) {
    if (customTemplateFile) {
      // Use FormData if file is included
      const formData = new FormData();
      formData.append("customTemplate", customTemplateFile);

      // Append all contract details as individual form fields
      Object.keys(contractDetails).forEach((key) => {
        if (key === "signatories") {
          formData.append(key, JSON.stringify(contractDetails[key]));
        } else {
          formData.append(key, contractDetails[key]);
        }
      });

      const response = await fetch(`${this.baseURL}/contracts/${id}/request`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to request contract");
      }

      return await response.json();
    } else {
      // Use regular JSON if no file
      return this.request(`/contracts/${id}/request`, {
        method: "POST",
        body: JSON.stringify(contractDetails),
      });
    }
  }

  async uploadContractPdf(id, pdfFile, adminNotes, editedData = null) {
    const formData = new FormData();
    formData.append("contractPdf", pdfFile);
    if (adminNotes) formData.append("adminNotes", adminNotes);
    if (editedData) formData.append("editedData", JSON.stringify(editedData));

    const response = await fetch(`${this.baseURL}/contracts/${id}/upload-pdf`, {
      method: "POST",
      credentials: "include",
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to upload contract");
    }

    return response.json();
  }

  async uploadHardboundContract(id, pdfFile) {
    const formData = new FormData();
    formData.append("hardboundContract", pdfFile);

    const response = await fetch(`${this.baseURL}/contracts/${id}/upload-hardbound`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to upload hardbound contract");
    }

    return response.json();
  }

  async sendContractToSales(id) {
    return this.request(`/contracts/${id}/send-to-sales`, {
      method: "POST",
    });
  }

  async sendContractToClient(id, clientEmail) {
    return this.request(`/contracts/${id}/send-to-client`, {
      method: "POST",
      body: JSON.stringify({ clientEmail }),
    });
  }

  async downloadContractPdf(id) {
    const url = `${this.baseURL}/contracts/${id}/contract-pdf`;
    window.open(url, "_blank");
  }

  async previewContractPdf(id) {
    const url = `${this.baseURL}/contracts/${id}/preview-pdf`;
    window.open(url, "_blank");
  }

  async generateContractFromTemplate(id, editedData = null, adminNotes = null) {
    return this.request(`/contracts/${id}/generate-from-template`, {
      method: "POST",
      body: JSON.stringify({ editedData, adminNotes }),
    });
  }

  async previewContractFromTemplate(id, editedData = null) {
    return this.request(`/contracts/${id}/preview-from-template`, {
      method: "POST",
      body: JSON.stringify({ editedData }),
    });
  }

  // Contract Template endpoints
  async getContractTemplates(filters = {}) {
    const params = new URLSearchParams();
    if (filters.isActive !== undefined)
      params.append("isActive", filters.isActive);
    if (filters.templateType) params.append("templateType", filters.templateType);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const queryString = params.toString();
    return this.request(
      `/contract-templates${queryString ? `?${queryString}` : ""}`,
    );
  }

  async getContractTemplateById(id) {
    return this.request(`/contract-templates/${id}`);
  }

  async getDefaultContractTemplate() {
    return this.request("/contract-templates/default");
  }

  async getContractTemplateByType(type) {
    return this.request(`/contract-templates/type/${type}`);
  }

  async createContractTemplate(templateData) {
    return this.request("/contract-templates", {
      method: "POST",
      body: JSON.stringify(templateData),
    });
  }

  async updateContractTemplate(id, templateData) {
    return this.request(`/contract-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(templateData),
    });
  }

  async setDefaultContractTemplate(id) {
    return this.request(`/contract-templates/${id}/set-default`, {
      method: "POST",
    });
  }

  async deleteContractTemplate(id) {
    return this.request(`/contract-templates/${id}`, {
      method: "DELETE",
    });
  }

  async previewContractTemplate(templateHtml, sampleData) {
    return this.request("/contract-templates/preview", {
      method: "POST",
      body: JSON.stringify({ templateHtml, sampleData }),
    });
  }

  // Calendar Event endpoints
  async getCalendarEvents(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.status) params.append("status", filters.status);
    if (filters.inquiryId) params.append("inquiryId", filters.inquiryId);
    if (filters.viewAll !== undefined)
      params.append("viewAll", filters.viewAll);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const queryString = params.toString();
    return this.request(
      `/calendar-events${queryString ? `?${queryString}` : ""}`,
    );
  }

  async getCalendarEventById(id) {
    return this.request(`/calendar-events/${id}`);
  }

  async createCalendarEvent(data) {
    return this.request("/calendar-events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCalendarEvent(id, data) {
    return this.request(`/calendar-events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async completeCalendarEvent(id) {
    return this.request(`/calendar-events/${id}/complete`, {
      method: "POST",
    });
  }

  async deleteCalendarEvent(id) {
    return this.request(`/calendar-events/${id}`, {
      method: "DELETE",
    });
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
