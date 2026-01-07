import React, { useState } from "react";
import SectionShell from "../common/SectionShell";
import RevealOnScroll from "../common/RevealOnScroll";

const services = [
  {
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    title: "Hauling",
    description: "Mixed, food, residual & construction.",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M16 8l-8-4l-6 8h12v6l8-4l-6-6z" />
        <circle cx="9" cy="19" r="2" />
      </svg>
    ),
    title: "Recyclables",
    description: "Carton, plastic, aluminum, copper, metal.",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2v20M2 12h20" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
    title: "Septic",
    description: "Tank siphoning & liquid waste handling.",
  },
];

const CTASection = () => {
  const [formData, setFormData] = useState({
    company: "",
    email: "",
    phone: "",
    wasteType: "",
    location: "",
  });
  const [focusedField, setFocusedField] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  // Validation functions
  const validatePhone = (phone) => {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, "");

    // Philippine phone number validation
    // Mobile: 09XX XXX XXXX (11 digits) or +639XX XXX XXXX (13 digits with +63)
    // Landline: (0XX) XXX XXXX (10 digits)

    if (!phone.trim()) {
      return "Phone number is required";
    }

    // Check if starts with +63 (Philippine country code)
    if (phone.startsWith("+63")) {
      if (digitsOnly.length !== 12) {
        // +63 + 10 digits
        return "Philippine mobile number should be +63 9XX XXX XXXX";
      }
      if (!digitsOnly.startsWith("639")) {
        return "Philippine mobile number should start with +63 9";
      }
    }
    // Check if starts with 09 (Philippine mobile format)
    else if (phone.startsWith("09")) {
      if (digitsOnly.length !== 11) {
        return "Philippine mobile number should be 09XX XXX XXXX (11 digits)";
      }
    }
    // Check if it's a landline format starting with 0
    else if (phone.startsWith("0") && !phone.startsWith("09")) {
      if (digitsOnly.length < 10 || digitsOnly.length > 11) {
        return "Landline number should be 10-11 digits";
      }
    }
    // International format without +
    else if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      // Allow international numbers (10-15 digits)
      return null;
    } else {
      return "Please enter a valid phone number";
    }

    return null; // No error
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }

    return null;
  };

  const validateCompany = (company) => {
    if (!company.trim()) {
      return "Company/Site name is required";
    }

    if (company.trim().length < 2) {
      return "Company name must be at least 2 characters";
    }

    return null;
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleBlur = (field) => () => {
    setFocusedField(null);

    // Validate on blur
    let error = null;
    if (field === "phone") {
      error = validatePhone(formData.phone);
    } else if (field === "email") {
      error = validateEmail(formData.email);
    } else if (field === "company") {
      error = validateCompany(formData.company);
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Validate all fields before submission
    const newErrors = {};
    newErrors.company = validateCompany(formData.company);
    newErrors.email = validateEmail(formData.email);
    newErrors.phone = validatePhone(formData.phone);

    if (!formData.wasteType.trim()) {
      newErrors.wasteType = "Waste type is required";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    // Filter out null errors
    const hasErrors = Object.values(newErrors).some((error) => error !== null);

    if (hasErrors) {
      setErrors(newErrors);
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus(null), 3000);
      return;
    }

    // Create email content
    const subject = encodeURIComponent(
      `Waste PH Inquiry - ${formData.company}`
    );
    const body = encodeURIComponent(
      `New inquiry from Waste PH website:\n\n` +
        `Company/Site: ${formData.company}\n` +
        `Email: ${formData.email}\n` +
        `Phone: ${formData.phone}\n` +
        `Waste Type: ${formData.wasteType}\n` +
        `Location: ${formData.location}\n\n` +
        `---\n` +
        `This inquiry was submitted via the Waste PH contact form.`
    );

    // Open email client with pre-filled content
    window.location.href = `mailto:sales@waste.ph?subject=${subject}&body=${body}`;

    // Show success message
    setSubmitStatus("success");

    // Reset form after a delay
    setTimeout(() => {
      setFormData({
        company: "",
        email: "",
        phone: "",
        wasteType: "",
        location: "",
      });
      setErrors({});
      setSubmitStatus(null);
    }, 3000);
  };

  return (
    <SectionShell
      id="contact"
      label="Get Started"
      headline="Tell us what you need moved."
      subheadline="Share details and we'll reach back with the right program."
      variant="accent"
    >
      <div className="mx-auto max-w-5xl">
        {/* Compact Services Grid */}
        <RevealOnScroll delayClass="delay-200">
          <div className="mb-4 grid gap-3 sm:grid-cols-3 md:mb-5 lg:gap-4">
            {services.map((service, index) => (
              <div
                key={service.title}
                className="group relative overflow-hidden rounded-xl border-2 border-[#15803d]/30 bg-linear-to-br from-[#15803d]/15 via-[#15803d]/5 to-transparent p-3 backdrop-blur-sm transition-all duration-300 hover:border-[#15803d] hover:shadow-[0_0_20px_rgba(21,128,61,0.3)] sm:p-3.5"
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute right-0 top-0 h-full w-full rounded-xl bg-linear-to-br from-[#15803d]/20 to-transparent" />
                </div>

                <div className="relative flex items-start gap-2.5">
                  <div className="shrink-0 rounded-lg bg-[#15803d] p-2 text-white shadow-[0_0_12px_rgba(21,128,61,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_18px_rgba(21,128,61,0.6)]">
                    {service.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black uppercase tracking-wide text-white">
                      {service.title}
                    </h3>
                    <p className="mt-0.5 text-xs leading-snug text-white/70">
                      {service.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        {/* Compact Form */}
        <RevealOnScroll delayClass="delay-300">
          <form
            className="relative overflow-hidden rounded-xl border-2 border-[#15803d]/50 bg-linear-to-br from-[#15803d]/20 via-[#0a1f0f]/95 to-[#051008]/90 p-5 shadow-[0_0_40px_rgba(21,128,61,0.3)] backdrop-blur-xl sm:p-6 md:p-7"
            onSubmit={handleSubmit}
          >
            {/* Decorative gradient - brighter */}
            <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 -translate-y-32 translate-x-32 rounded-full bg-[#15803d]/25 blur-3xl" />

            <div className="relative space-y-4">
              {/* Form fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Company Name */}
                <label className="group relative space-y-2">
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#15803d] sm:text-sm">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Company / Site
                  </span>
                  <input
                    type="text"
                    className={`w-full rounded-lg border-2 bg-white/8 px-4 py-3 text-sm font-medium text-white outline-none transition-all placeholder:text-white/40 sm:text-base ${
                      errors.company
                        ? "border-red-500 focus:border-red-500 focus:bg-red-500/10 focus:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                        : "border-white/30 focus:border-[#15803d] focus:bg-[#15803d]/10 focus:shadow-[0_0_25px_rgba(21,128,61,0.4)]"
                    }`}
                    placeholder="Your business name"
                    value={formData.company}
                    onChange={handleChange("company")}
                    onFocus={() => setFocusedField("company")}
                    onBlur={handleBlur("company")}
                    required
                    aria-invalid={errors.company ? "true" : "false"}
                    aria-describedby={
                      errors.company ? "company-error" : undefined
                    }
                  />
                  {errors.company && (
                    <p
                      id="company-error"
                      className="text-xs text-red-400 font-medium"
                    >
                      {errors.company}
                    </p>
                  )}
                </label>

                {/* Email */}
                <label className="group relative space-y-2">
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#15803d] sm:text-sm">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Email Address
                  </span>
                  <input
                    type="email"
                    className={`w-full rounded-lg border-2 bg-white/8 px-4 py-3 text-sm font-medium text-white outline-none transition-all placeholder:text-white/40 sm:text-base ${
                      errors.email
                        ? "border-red-500 focus:border-red-500 focus:bg-red-500/10 focus:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                        : "border-white/30 focus:border-[#15803d] focus:bg-[#15803d]/10 focus:shadow-[0_0_25px_rgba(21,128,61,0.4)]"
                    }`}
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange("email")}
                    onFocus={() => setFocusedField("email")}
                    onBlur={handleBlur("email")}
                    required
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p
                      id="email-error"
                      className="text-xs text-red-400 font-medium"
                    >
                      {errors.email}
                    </p>
                  )}
                </label>

                {/* Phone Number */}
                <label className="group relative space-y-2">
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#15803d] sm:text-sm">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Phone Number
                  </span>
                  <input
                    type="tel"
                    className={`w-full rounded-lg border-2 bg-white/8 px-4 py-3 text-sm font-medium text-white outline-none transition-all placeholder:text-white/40 sm:text-base ${
                      errors.phone
                        ? "border-red-500 focus:border-red-500 focus:bg-red-500/10 focus:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                        : "border-white/30 focus:border-[#15803d] focus:bg-[#15803d]/10 focus:shadow-[0_0_25px_rgba(21,128,61,0.4)]"
                    }`}
                    placeholder="+63 912 345 6789"
                    value={formData.phone}
                    onChange={handleChange("phone")}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={handleBlur("phone")}
                    required
                    aria-invalid={errors.phone ? "true" : "false"}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                  />
                  {errors.phone && (
                    <p
                      id="phone-error"
                      className="text-xs text-red-400 font-medium"
                    >
                      {errors.phone}
                    </p>
                  )}
                </label>

                {/* Waste Type */}
                <label className="group relative space-y-2">
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#15803d] sm:text-sm">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Waste Type
                  </span>
                  <input
                    type="text"
                    className={`w-full rounded-lg border-2 bg-white/8 px-4 py-3 text-sm font-medium text-white outline-none transition-all placeholder:text-white/40 sm:text-base ${
                      errors.wasteType
                        ? "border-red-500 focus:border-red-500 focus:bg-red-500/10 focus:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                        : "border-white/30 focus:border-[#15803d] focus:bg-[#15803d]/10 focus:shadow-[0_0_25px_rgba(21,128,61,0.4)]"
                    }`}
                    placeholder="Mixed, food, residual..."
                    value={formData.wasteType}
                    onChange={handleChange("wasteType")}
                    onFocus={() => setFocusedField("wasteType")}
                    onBlur={() => setFocusedField(null)}
                    required
                    aria-invalid={errors.wasteType ? "true" : "false"}
                    aria-describedby={
                      errors.wasteType ? "wasteType-error" : undefined
                    }
                  />
                  {errors.wasteType && (
                    <p
                      id="wasteType-error"
                      className="text-xs text-red-400 font-medium"
                    >
                      {errors.wasteType}
                    </p>
                  )}
                </label>

                {/* Location */}
                <label className="group relative space-y-2">
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#15803d] sm:text-sm">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Location
                  </span>
                  <input
                    type="text"
                    className={`w-full rounded-lg border-2 bg-white/8 px-4 py-3 text-sm font-medium text-white outline-none transition-all placeholder:text-white/40 sm:text-base ${
                      errors.location
                        ? "border-red-500 focus:border-red-500 focus:bg-red-500/10 focus:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                        : "border-white/30 focus:border-[#15803d] focus:bg-[#15803d]/10 focus:shadow-[0_0_25px_rgba(21,128,61,0.4)]"
                    }`}
                    placeholder="City or site address"
                    value={formData.location}
                    onChange={handleChange("location")}
                    onFocus={() => setFocusedField("location")}
                    onBlur={() => setFocusedField(null)}
                    required
                    aria-invalid={errors.location ? "true" : "false"}
                    aria-describedby={
                      errors.location ? "location-error" : undefined
                    }
                  />
                  {errors.location && (
                    <p
                      id="location-error"
                      className="text-xs text-red-400 font-medium"
                    >
                      {errors.location}
                    </p>
                  )}
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className={`group relative w-full overflow-hidden rounded-xl px-8 py-4 text-base font-black uppercase tracking-wide text-white shadow-[0_8px_30px_rgba(21,128,61,0.4)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                    submitStatus === "success"
                      ? "bg-[#16a34a] focus-visible:ring-[#16a34a]"
                      : submitStatus === "error"
                      ? "bg-red-600 shadow-[0_8px_30px_rgba(239,68,68,0.4)] focus-visible:ring-red-500"
                      : "bg-linear-to-r from-[#15803d] to-[#16a34a] hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(21,128,61,0.6)] focus-visible:ring-[#15803d]"
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {submitStatus === "success" ? (
                      <>
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Email Client Opened
                      </>
                    ) : submitStatus === "error" ? (
                      <>
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Please Fix Errors
                      </>
                    ) : (
                      <>
                        Send Request
                        <svg
                          className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </span>
                  {/* Shimmer effect */}
                  {submitStatus !== "success" && submitStatus !== "error" && (
                    <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  )}
                </button>

                {/* Note */}
                <p className="mt-3 text-center text-xs text-white/60 leading-relaxed">
                  After sending your email, our team will contact you shortly to
                  discuss your waste management needs.
                </p>
              </div>

              {/* Contact Info */}
              <div className="flex flex-col items-center gap-3 border-t border-white/10 pt-4 text-center sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-[#15803d]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <a
                    href="tel:+639562461503"
                    className="text-sm font-bold text-white transition-colors hover:text-[#16a34a]"
                  >
                    0956 246 1503
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-[#15803d]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <a
                    href="mailto:sales@waste.ph"
                    className="text-sm font-bold text-white transition-colors hover:text-[#16a34a]"
                  >
                    sales@waste.ph
                  </a>
                </div>
              </div>
            </div>
          </form>
        </RevealOnScroll>
      </div>
    </SectionShell>
  );
};

export default CTASection;
