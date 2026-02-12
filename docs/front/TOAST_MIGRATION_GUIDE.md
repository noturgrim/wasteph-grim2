# Toast Migration Guide

## Overview
We've created a custom toast wrapper (`front/src/admin/utils/toast.js`) that automatically applies soft color styling to all toast notifications.

## Benefits
- ✅ Consistent styling across all toasts (success, error, warning, info)
- ✅ Automatic light/dark mode support
- ✅ No need to pass style objects every time
- ✅ Clean, maintainable code

## How to Use

### 1. Update Import Statement
Change from:
```javascript
import { toast } from "sonner";
```

To:
```javascript
import { toast } from "../utils/toast";
// or
import { toast } from "@/admin/utils/toast";
```

### 2. Use Toast Methods (No Changes Needed!)
The API is exactly the same as before:

```javascript
// Success toast - soft green background
toast.success("Lead claimed successfully!");

// Error toast - soft red background
toast.error("Failed to create lead");

// Warning toast - soft amber background
toast.warning("Please check the entered data");

// Info toast - soft blue background
toast.info("This is for your information");
```

## Files Updated ✅

All files have been migrated to use the custom toast wrapper:
- ✅ `front/src/admin/pages/Leads.jsx`
- ✅ `front/src/admin/pages/Inquiries.jsx`
- ✅ `front/src/admin/pages/Proposals.jsx`
- ✅ `front/src/admin/pages/ProposalTemplates.jsx`
- ✅ `front/src/admin/components/inquiries/RequestProposalDialog.jsx`
- ✅ `front/src/admin/components/inquiries/SendProposalDialog.jsx`
- ✅ `front/src/admin/components/inquiries/NotesTimeline.jsx`
- ✅ `front/src/admin/components/templates/TemplateEditorDialog.jsx`

## Color Scheme

### Success (Green)
- Light mode: Darker green (#15803d from chart-1)
- Dark mode: Bright green (#22c55e)
- 10% opacity background mix

### Error (Red)
- Uses `var(--destructive)` from your theme
- 10% opacity background mix

### Warning (Amber)
- Light mode: Darker amber (#d97706)
- Dark mode: Bright amber (#fbbf24)
- 10% opacity background mix

### Info (Sky Blue)
- Light mode: Darker blue (#0284c7)
- Dark mode: Bright blue (#38bdf8)
- 10% opacity background mix

## Advanced Usage

If you need to override styles for a specific toast:
```javascript
toast.success("Custom styled toast", {
  style: {
    '--normal-bg': 'your-custom-color'
  }
});
```

The custom styles will merge with the default soft styles.
