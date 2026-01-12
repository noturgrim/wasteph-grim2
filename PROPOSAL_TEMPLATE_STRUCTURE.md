# Proposal Template Structure Analysis

Based on the 7 PDF templates, here's the detailed structure for each template type:

---

## Common Fields (All Templates)

These fields appear in **ALL** proposal templates:

### Client Information
- `clientName` - Client's full name
- `clientPosition` - Client's job position (optional)
- `clientCompany` - Client's company name (optional)
- `clientAddress` - Full address (optional)
- `clientEmail` - Contact email
- `clientPhone` - Contact phone number

### Date Information
- `proposalDate` - Date the proposal is created
- `validUntilDate` - Proposal validity expiration date

### Services Array
```javascript
services: [
  {
    name: "Service name",
    description: "Service description",
    quantity: 1,
    unitPrice: 5000.00,
    subtotal: 5000.00
  }
]
```

### Pricing
```javascript
pricing: {
  subtotal: 5000.00,
  tax: 600.00,
  discount: 0,
  total: 5600.00,
  taxRate: 12
}
```

### Terms
```javascript
terms: {
  paymentTerms: "Net 30",
  validityDays: 30,
  notes: "Additional notes"
}
```

---

## Template 1: One Time Compactor Hauling

**Template Type:** `compactor_hauling`
**Category:** `waste_collection`

### Template-Specific Fields:
```javascript
{
  wasteAllowance: 100, // in kg
  excessRate: 5.00,    // PHP per kg
  scheduleFrequency: "flexible", // "flexible", "daily", "weekly", etc.
  pickupsPerWeek: 7    // 1-7 times per week
}
```

### Services Table Structure:
| Column | Description |
|--------|-------------|
| Solid Waste Classification | Service name (e.g., "Biodegradable waste") |
| Price per month (PHP) | Monthly cost |
| Waste Allowance | kg allowance per service |

### Key Sections:
1. Scope of Work → Garbage Collection
2. Terms (Payment Terms, Schedule)
3. Our Guarantees (On Time, Cost Effective, Proper Disposal)
4. Disposal Process
5. Signature Section

---

## Template 2: Hazardous Waste Collection

**Template Type:** `hazardous_waste`
**Category:** `hazardous`

### Template-Specific Fields:
```javascript
{
  wasteTypes: [
    {
      classification: "Chemical Waste",
      unNumber: "UN1234", // UN number for hazardous materials
      packingGroup: "II",
      quantity: 50,       // in kg or liters
      unit: "kg"
    }
  ],
  requiresManifest: true,
  manifestNumber: "MF-2024-001",
  transportLicense: "TR-2024-001",
  disposalFacility: "Prime Waste Solutions MRF",
  disposalMethod: "Incineration/Treatment/Stabilization"
}
```

### Services Table Structure:
| Column | Description |
|--------|-------------|
| Waste Type | Classification of hazardous waste |
| UN Number | United Nations dangerous goods number |
| Quantity | Amount in kg/liters |
| Unit Price | Cost per kg/liter |
| Total | Subtotal per waste type |

### Key Sections:
1. Scope of Work → Hazardous Waste Collection
2. Waste Manifest Details
3. Transportation & Handling Procedures
4. Disposal Certification
5. Safety & Compliance Guarantees

---

## Template 3: Fixed Monthly Rate

**Template Type:** `fixed_monthly`
**Category:** `waste_collection`

### Template-Specific Fields:
```javascript
{
  contractDuration: 12,        // months
  monthlyRate: 15000.00,       // Fixed monthly amount
  inclusionsDescription: "Includes all waste types, unlimited pickups",
  pickupSchedule: "Monday, Wednesday, Friday",
  additionalServices: [
    {
      name: "Emergency pickup",
      rate: 500.00,
      unit: "per call"
    }
  ]
}
```

### Services Table Structure:
| Column | Description |
|--------|-------------|
| Service Description | What's included in the monthly rate |
| Monthly Rate (PHP) | Fixed monthly cost |
| Frequency | Pickup schedule |
| Inclusions | What's covered |

### Key Sections:
1. Scope of Work → Monthly Service Agreement
2. Inclusions & Exclusions
3. Terms (Duration, Payment, Schedule)
4. Additional Services Available

---

## Template 4: Clearing Proposal (Project-based)

**Template Type:** `clearing_project`
**Category:** `waste_collection`

### Template-Specific Fields:
```javascript
{
  projectLocation: "Full address of site",
  projectDuration: "5 days",
  estimatedVolume: 500,        // cubic meters or tons
  volumeUnit: "cubic meters",
  equipment: [
    {
      name: "Dump Truck (6-wheeler)",
      quantity: 2,
      hours: 8,
      rate: 3500.00,
      subtotal: 28000.00
    },
    {
      name: "Loader",
      quantity: 1,
      hours: 8,
      rate: 2500.00,
      subtotal: 20000.00
    }
  ],
  laborCrew: {
    numberOfWorkers: 10,
    daysRequired: 5,
    ratePerDay: 500.00,
    totalLabor: 25000.00
  },
  disposalSite: "Prime Waste Solutions MRF"
}
```

### Services Table Structure:
| Column | Description |
|--------|-------------|
| Equipment/Service | Type of equipment or labor |
| Quantity | Number of units |
| Duration | Hours or days |
| Rate | Cost per unit |
| Total | Subtotal |

### Key Sections:
1. Project Overview (Location, Scope, Timeline)
2. Equipment & Labor Requirements
3. Disposal & Transportation
4. Project Schedule
5. Payment Terms (usually milestone-based)

---

## Template 5: One Time Hauling (Per-trip)

**Template Type:** `one_time_hauling`
**Category:** `waste_collection`

### Template-Specific Fields:
```javascript
{
  pickupLocation: "Full address",
  destinationLocation: "Disposal site address",
  estimatedWeight: 500,        // in kg
  truckType: "6-wheeler",      // "4-wheeler", "6-wheeler", "10-wheeler"
  numberOfTrips: 3,
  ratePerTrip: 2500.00,
  distanceCovered: 15,         // in kilometers
  fuelSurcharge: 200.00,       // if applicable
  tollFees: 100.00             // if applicable
}
```

### Services Table Structure:
| Column | Description |
|--------|-------------|
| Truck Type | Type of truck used |
| Number of Trips | How many trips needed |
| Rate per Trip (PHP) | Cost per single trip |
| Additional Charges | Fuel, toll, etc. |
| Total | Subtotal |

### Key Sections:
1. Service Details (Pickup/Destination)
2. Hauling Specifications
3. Trip Pricing Breakdown
4. Terms & Conditions

---

## Template 6: Long Term Garbage (Per-kg)

**Template Type:** `long_term`
**Category:** `waste_collection`

### Template-Specific Fields:
```javascript
{
  contractDuration: 12,        // months
  billingCycle: "monthly",     // "weekly", "bi-weekly", "monthly"
  ratePerKg: 3.50,            // PHP per kg
  minimumMonthlyCharge: 5000.00,
  averageMonthlyWeight: 2000,  // in kg
  pickupSchedule: "As needed", // or specific schedule
  weighingMethod: "On-site scale / Facility scale",
  reportingFrequency: "monthly"
}
```

### Services Table Structure:
| Column | Description |
|--------|-------------|
| Waste Classification | Type of waste |
| Rate per kg (PHP) | Cost per kilogram |
| Estimated Monthly Volume | Expected kg per month |
| Minimum Charge | Base monthly fee |

### Key Sections:
1. Scope of Work → Long-term Per-kg Service
2. Pricing Structure (Per-kg rates, minimums)
3. Weighing & Documentation Process
4. Terms (Duration, Billing, Schedule)
5. Monthly Reporting

---

## Template 7: Purchase of Recyclables

**Template Type:** `recyclables_purchase`
**Category:** `recyclables`

### Template-Specific Fields:
```javascript
{
  recyclableTypes: [
    {
      material: "PET Plastic Bottles",
      grade: "Grade A (Clean, clear)",
      purchaseRate: 15.00,      // PHP per kg
      minimumQuantity: 50,       // kg
      paymentTerms: "Upon delivery"
    },
    {
      material: "Cardboard",
      grade: "Corrugated",
      purchaseRate: 8.00,
      minimumQuantity: 100,
      paymentTerms: "Upon delivery"
    }
  ],
  qualityRequirements: "Clean, dry, sorted",
  pickupAvailable: true,
  pickupFee: 500.00,           // if applicable
  paymentMethod: "Cash/Bank Transfer",
  weightingLocation: "Our facility / Your location"
}
```

### Services Table Structure:
| Column | Description |
|--------|-------------|
| Material Type | Type of recyclable (PET, Cardboard, etc.) |
| Grade | Quality specification |
| Purchase Rate (PHP/kg) | What we pay per kg |
| Minimum Quantity | Minimum kg required |
| Payment Terms | When payment is made |

### Key Sections:
1. Materials We Purchase
2. Quality Requirements & Grading
3. Pricing & Payment Terms
4. Collection/Delivery Process
5. Weighing & Documentation

---

## Form Design Recommendations

### Progressive Form Based on Template Type

When user selects a template, show:

1. **Common Section** (Always visible)
   - Client Information
   - Services Array
   - Basic Pricing
   - Terms & Conditions

2. **Template-Specific Section** (Conditional based on template)
   - For Compactor Hauling → Waste Allowance & Excess Rate fields
   - For Hazardous → Waste Types & Manifest fields
   - For Fixed Monthly → Contract Duration & Inclusions
   - For Clearing → Equipment & Labor tables
   - For One Time → Trip details & truck type
   - For Long Term → Per-kg rate & billing cycle
   - For Recyclables → Material types & purchase rates

### UI Components Needed

1. **Dynamic Service Table**
   - Add/remove rows
   - Different columns based on template type

2. **Equipment Table** (For Clearing template)
   - Equipment name, quantity, hours, rate
   - Auto-calculate subtotals

3. **Waste Types Table** (For Hazardous template)
   - Material classification, UN number, quantity, unit

4. **Recyclables Table** (For Recyclables template)
   - Material type, grade, purchase rate, minimum quantity

5. **Location Fields** (For One Time Hauling)
   - Pickup location
   - Destination location
   - Distance calculator (optional)

---

## Database Schema Considerations

The current `proposalData` JSON field can store all these template-specific fields. The structure would be:

```javascript
{
  // Common fields
  services: [...],
  pricing: {...},
  terms: {...},

  // Template-specific fields (varies by template)
  wasteAllowance: 100,
  excessRate: 5.00,
  equipment: [...],
  recyclableTypes: [...],
  // etc.
}
```

This flexible JSON structure allows each template to have its own unique fields without requiring schema changes.
