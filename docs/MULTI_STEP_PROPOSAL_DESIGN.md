# Multi-Step Proposal Form Design

## Overview
Transform the RequestProposalDialog into a beautiful multi-step wizard with 5 steps, inspired by modern onboarding flows.

---

## Step Flow

### Step 1: Service Type Selection ✅ (IMPLEMENTED)
**Visual:** Grid of cards with icons

**Content:**
```jsx
<div className="grid grid-cols-2 gap-4">
  {SERVICE_TYPES.map(serviceType => (
    <button onClick={() => selectService(serviceType)}>
      <div className="text-3xl">{serviceType.icon}</div>
      <div>{serviceType.label}</div>
    </button>
  ))}
</div>

{selectedTemplate && (
  <div className="success-banner">
    ✨ Template auto-selected: {selectedTemplate.name}
  </div>
)}
```

---

### Step 2: Service-Specific Details
**Visual:** Dynamic form based on service type

**Content:** Show the service-specific fields section (already built)
- Compactor Hauling: Waste Allowance, Excess Rate
- Hazardous: Manifest Number, Transport License
- Fixed Monthly: Contract Duration, Monthly Rate, Schedule
- One Time: Truck Type, Trips, Rate
- Long Term: Rate/kg, Minimum Charge
- Clearing: Project Duration

---

### Step 3: Services & Pricing
**Visual:** Service line items + pricing calculator

**Content:** The existing services table section
- Add/Remove services
- Quantity, Unit Price, Subtotal
- Discount, Tax Rate
- Pricing summary

---

### Step 4: Terms & Conditions
**Visual:** Simple form with 2-3 fields

**Content:** The existing terms section
- Payment Terms (Net 30)
- Validity Days (30)
- Additional Notes (textarea)

---

### Step 5: Preview
**Visual:** PDF preview (existing preview modal content)

**Content:**
- Show the generated PDF
- "Back to Edit" button
- "Submit Proposal" button

---

## Navigation

### Bottom Navigation Bar (Fixed)

```jsx
<div className="px-6 py-4 border-t bg-white dark:bg-slate-900 flex items-center justify-between">
  {/* Left: Previous Button */}
  {currentStep > 1 && (
    <Button
      type="button"
      variant="outline"
      onClick={goToPrevStep}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Previous
    </Button>
  )}

  {/* Right: Next/Submit Button */}
  <div className="ml-auto">
    {currentStep < 5 ? (
      <Button
        type="button"
        onClick={goToNextStep}
        disabled={!canProceed()}
      >
        Next
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    ) : (
      <Button type="submit" disabled={isSubmitting}>
        <Eye className="h-4 w-4 mr-2" />
        {isSubmitting ? "Generating..." : "Submit Proposal"}
      </Button>
    )}
  </div>
</div>
```

---

## Validation Rules

### Step 1 → Step 2
- ✅ Service type must be selected
- ✅ Template must be loaded

### Step 2 → Step 3
- No validation (all fields optional for now)
- Could add: Required fields based on service type

### Step 3 → Step 4
- ✅ At least 1 service added
- ✅ Service name filled
- ✅ Unit price > 0

### Step 4 → Step 5 (Preview)
- ✅ Payment terms filled
- ✅ Validity days > 0

---

## Implementation Approach

### Option A: Conditional Rendering (Simpler)
Keep all existing form sections, just show/hide based on `currentStep`:

```jsx
{currentStep === 1 && <ServiceTypeSelection />}
{currentStep === 2 && <ServiceDetails />}
{currentStep === 3 && <ServicesAndPricing />}
{currentStep === 4 && <TermsAndConditions />}
{currentStep === 5 && <PreviewSection />}
```

### Option B: Component Refactor (Cleaner)
Extract each step into a separate component:

```jsx
const steps = {
  1: <StepServiceType />,
  2: <StepServiceDetails />,
  3: <StepServicesPricing />,
  4: <StepTerms />,
  5: <StepPreview />,
};

return steps[currentStep];
```

**Recommendation:** Option A for now (faster), refactor to Option B later if needed.

---

## Visual Enhancements

### Step Indicator (Already Implemented ✅)
- Circular icons for each step
- Active step: Blue with ring
- Completed steps: Green (clickable)
- Upcoming steps: Gray (disabled)
- Progress line between steps

### Card-Based Service Selection (Step 1) ✅
- 2-column grid
- Large emoji icon
- Hover effects
- Selected state with blue border

### Smooth Transitions
Add fade-in animation when changing steps:

```jsx
<div className="animate-in fade-in duration-200">
  {currentStepContent}
</div>
```

---

## File Structure

### Current File
`RequestProposalDialog.jsx` - 1100+ lines ⚠️ Getting too large!

### Suggested Refactor (Future)
```
components/inquiries/proposal/
  ├── RequestProposalDialog.jsx (main wrapper)
  ├── StepIndicator.jsx
  ├── steps/
  │   ├── StepServiceType.jsx
  │   ├── StepServiceDetails.jsx
  │   ├── StepServicesPricing.jsx
  │   ├── StepTerms.jsx
  │   └── StepPreview.jsx
  └── NavigationButtons.jsx
```

---

## What's Left to Implement

1. ✅ Step indicator UI
2. ✅ Step 1: Service type card grid
3. ⚠️ Wrap Step 2-4 content in conditional `{currentStep === X && (...content...)}`
4. ⏳ Bottom navigation bar with Previous/Next buttons
5. ⏳ Validation logic for `canProceed()` function
6. ⏳ Update form submit to only happen on Step 5

---

## Quick Win Implementation

Since the file is large, here's the fastest path:

1. Keep Step 1 as-is (already done)
2. Wrap existing service-specific fields in `{currentStep === 2 && (...)}`
3. Wrap existing services/pricing in `{currentStep === 3 && (...)}`
4. Wrap existing terms in `{currentStep === 4 && (...)}`
5. Use existing preview logic for Step 5
6. Add navigation buttons at bottom

This keeps all existing logic intact, just controls visibility with steps!
