# Template System

## Overview

WastePH uses Handlebars-based HTML templates for both **Proposals** and **Contracts**. Templates are created/edited by admins in the CRM, rendered server-side with real data, and converted to PDFs via Puppeteer before being sent to clients.

There are two distinct editor surfaces:

| Editor | Used when | Component |
|---|---|---|
| **HTMLTemplateEditor** | Admin creates or edits a template definition (the reusable blueprint) | `front/src/admin/components/templates/HTMLTemplateEditor.jsx` |
| **ProposalHtmlEditor** | Sales edits the rendered output of a template for a specific proposal or contract before sending | `front/src/components/common/ProposalHtmlEditor.jsx` |

---

## Architecture: How a template becomes a PDF

```
Template (stored in DB as htmlTemplate string)
        │
        ▼
POST /api/proposal-templates/render          ← server-side Handlebars compile
        │  { templateHtml, data }
        ▼
pdfService.renderProposalTemplate(data, html) ← Handlebars.compile(html)(data)
        │  returns rendered HTML string
        ▼
ProposalHtmlEditor (Tiptap)                  ← sales edits the rendered HTML
        │  editor.getHTML()
        ▼
pdfService._generatePdf(html)               ← Puppeteer: setContent → page.pdf()
        │
        ▼
PDF buffer → base64 → email to client
```

The key rule: **all Handlebars compilation happens on the server** (`pdfService`). The frontend never compiles templates itself. This means `{{#each}}` blocks, helpers like `{{currency}}`, and all Handlebars logic render correctly in both previews and the final PDF.

---

## Handlebars Helpers

All helpers are registered once at startup in a single shared file. They are global — registering once is sufficient for all `Handlebars.compile()` calls anywhere in the process.

**File:** `backend/src/utils/handlebarsHelpers.js`

| Helper | Usage | Output |
|---|---|---|
| `currency` | `{{currency amount}}` | `₱5,000.00` |
| `formatDate` | `{{formatDate someDate}}` | `February 5, 2026` (or `N/A` if falsy) |
| `ifEquals` | `{{#ifEquals a b}}...{{/ifEquals}}` | Block renders if `a === b` |
| `ifGreaterThan` | `{{#ifGreaterThan a b}}...{{/ifGreaterThan}}` | Block renders if `a > b` |
| `multiply` | `{{multiply a b}}` | `a * b` |
| `add` | `{{add a b}}` | `a + b` |
| `subtract` | `{{subtract a b}}` | `a - b` |

Registration is called once in `pdfService` constructor. No other file registers helpers.

---

## Backend: Key Files

### `backend/src/services/pdfService.js`

The central hub for all template rendering and PDF generation.

- **`renderProposalTemplate(data, templateHtml)`** — Compiles a Handlebars template with the given data object. Returns the rendered HTML string. Despite the name, this is generic — it's used by both proposal and contract preview/render endpoints. No PDF involved.
- **`_getBrowser()`** — Lazy-initializes a cached Puppeteer browser instance. Checks `isConnected()` on each call; if the browser crashed, it re-launches transparently.
- **`_generatePdf(html)`** — The single shared Puppeteer path: opens a new page on the cached browser, sets content, generates PDF buffer, closes the page (not the browser). All 4 public PDF methods are thin wrappers around this.
- **`_destroyBrowser()`** — Closes the cached browser. Hooked into `process.on('exit'/'SIGTERM'/'SIGINT')`.

### `backend/src/controllers/proposalTemplateController.js`

- **`renderTemplate`** (line 304) — `POST /render` endpoint. Accepts `{ templateHtml, data }`. Calls `pdfService.renderProposalTemplate`. Returns `{ success: true, data: { html } }`. Used by the frontend for live previews and for loading rendered content into the editor.
- **`previewTemplate`** (line 206) — `POST /preview` endpoint. Same render call, but then also generates a PDF from the result. Used for PDF-format previews.

### `backend/src/routes/proposalTemplateRoutes.js`

Route order matters — specific routes (`/render`, `/preview`, `/default`, `/type/:type`) are all defined **before** the `/:id` catch-all.

---

## Frontend: Template Creation (HTMLTemplateEditor)

**File:** `front/src/admin/components/templates/HTMLTemplateEditor.jsx`

This is a split-pane editor: **code on the left, live preview on the right**.

- The left pane is a `<textarea>` where admins write raw HTML with Handlebars placeholders (`{{clientName}}`, `{{#each services}}`, etc.)
- An "Insert Placeholder" dropdown groups available placeholders by category and inserts them at the cursor position
- The right pane is an `<iframe srcdoc={...}>` that displays the server-rendered preview. On every keystroke (debounced 500ms), it calls `POST /proposal-templates/render` with sample data and displays the returned HTML inside the iframe
- The iframe provides true document isolation — template styles cannot leak out and break the admin page layout

**Sample data** sent to the render endpoint includes `services` (an array with line items), `pricing` (subtotal/tax/discount/total), and `terms`, so templates with `{{#each services}}` tables render their full structure in preview.

---

## Frontend: Template Preview Modals

Three components render template previews in modal dialogs. All three use the same pattern:

| Component | Where it's used |
|---|---|
| `TemplatePreviewModal` | Template list page |
| `TemplatePreviewDialog` | Template detail/management page |
| Both call `api.renderProposalTemplate()` | Server-side render → `<iframe srcdoc>` |

When a modal opens, it calls `POST /proposal-templates/render` with sample data and displays the returned HTML in a sandboxed iframe (`sandbox="allow-same-origin"`). No client-side Handlebars compilation, no CSS scoping regex.

---

## Frontend: Proposal/Contract Editor (ProposalHtmlEditor)

**File:** `front/src/components/common/ProposalHtmlEditor.jsx`

This is the rich-text editor that sales/admin uses to tweak the rendered output before sending a proposal or contract to a client. It is a **Tiptap** (ProseMirror) editor.

### Extensions loaded

- **StarterKit** — paragraphs, headings, bold, italic, lists, undo/redo
- **Underline**
- **TextAlign** — configured for headings, paragraphs, table cells, and table headers
- **Table, TableRow, TableCell, TableHeader** — full table support

### Toolbar

The toolbar is contextual:

- **Always visible:** Bold, Italic, Underline, Bullet List, Ordered List, 4 alignment buttons (left/center/right/justify)
- **Cursor outside a table:** "Insert Table" button appears (creates a 3×3 table)
- **Cursor inside a table:** Table controls appear instead — Add Row, Add Column, Delete Row, Delete Column

### Props interface

| Prop | Type | Description |
|---|---|---|
| `content` | `string` | Initial HTML string to load into the editor |
| `templateStyles` | `string` | CSS from the template's `<head>` — injected as scoped styles |
| `onChange` | `fn({ html, json })` | Called on every edit with current HTML and ProseMirror JSON |
| `onUnsavedChange` | `fn(bool)` | Called when editor content diverges from or matches `content` |
| `className` | `string` | Additional CSS classes |

### Style scoping

Template styles are injected into the page via a `<style>` tag. A `scopeStyles()` function prepends `.proposal-editor-scope` to every CSS selector so they only apply inside the editor container. The ProseMirror root element has this class applied via `editorProps.attributes.class`. `@`-rules (media queries, keyframes) are passed through unmodified.

### How it's used

Both `RequestProposalDialog` (proposals) and `GenerateContractDialog` (contracts) use this same component. The flow is:

1. The dialog calls `POST /proposal-templates/render` to get the server-rendered HTML
2. That HTML is passed as `content` to `ProposalHtmlEditor`
3. Sales edits the content (adds notes, tweaks text, adjusts table rows)
4. On save, `editor.getHTML()` is sent back to the backend
5. The backend generates the final PDF from that HTML via Puppeteer

---

## Puppeteer Browser Pooling

PDF generation does not launch a new browser per request. `pdfService` caches a single browser instance for the lifetime of the process.

- **First PDF request:** browser launches, gets cached
- **Subsequent requests:** a new page is opened on the existing browser, used, then closed
- **Browser crash:** `_getBrowser()` checks `isConnected()`. If false, it launches a fresh browser and caches it
- **Process shutdown:** `_destroyBrowser()` closes the browser cleanly

This means the first PDF in a session is slower (cold browser launch), but all subsequent ones are fast (page open/close only).

---

## Common Placeholders in Templates

These are the placeholders available when writing a template in `HTMLTemplateEditor`:

### Client
| Placeholder | Value |
|---|---|
| `{{clientName}}` | Full name |
| `{{clientEmail}}` | Email |
| `{{clientPhone}}` | Phone |
| `{{clientCompany}}` | Company name |
| `{{clientPosition}}` | Job title |
| `{{clientAddress}}` | Address |

### Dates
| Placeholder | Value |
|---|---|
| `{{proposalDate}}` | Proposal creation date |
| `{{validUntilDate}}` | Expiry date (proposal date + 30 days) |

### Services (iterable)
```handlebars
{{#each services}}
  <tr>
    <td>{{this.name}}</td>
    <td>{{this.quantity}}</td>
    <td>{{currency this.unitPrice}}</td>
    <td>{{currency this.subtotal}}</td>
  </tr>
{{/each}}
```

### Pricing
| Placeholder | Value |
|---|---|
| `{{currency pricing.subtotal}}` | Subtotal |
| `{{currency pricing.tax}}` | Tax amount |
| `{{currency pricing.discount}}` | Discount |
| `{{currency pricing.total}}` | Total |
| `{{currency pricing.monthlyRate}}` | Monthly rate |

---

## Adding a New Helper

1. Add the helper registration to `backend/src/utils/handlebarsHelpers.js` inside `registerHandlebarsHelpers()`
2. That's it — it's available in all templates immediately (helpers are global and registered at startup)
3. If you want it in the "Insert Placeholder" dropdown in `HTMLTemplateEditor`, add an entry to the `PROPOSAL_PLACEHOLDERS` array in that file

## Adding a New Placeholder Field

1. Add the field to the `data` object that gets passed to `renderProposalTemplate()` — this is in the controller or dialog that initiates the render
2. Add a matching entry to the sample data objects in:
   - `HTMLTemplateEditor.jsx` (for live preview while editing the template)
   - `TemplatePreviewModal.jsx` and `TemplatePreviewDialog.jsx` (for preview modals)
3. Add it to the `PROPOSAL_PLACEHOLDERS` array in `HTMLTemplateEditor.jsx` so it shows up in the Insert Placeholder dropdown
