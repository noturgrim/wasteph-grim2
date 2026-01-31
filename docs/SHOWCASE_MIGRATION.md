# Showcase Feature Migration Guide

## Overview

The Facebook integration has been **removed** and replaced with a CRM-based Showcase system. This gives you full control over what community impact items are displayed on the website.

## Changes Made

### Backend Changes

1. **New Database Table**: `showcase`
   - `id` (UUID, primary key)
   - `title` (text, required)
   - `tagline` (text, optional)
   - `description` (text, required)
   - `image` (text, optional - URL to image)
   - `link` (text, optional - external link for "Read More")
   - `displayOrder` (integer, default 0 - higher numbers appear first)
   - `isActive` (boolean, default true)
   - `createdBy` (user reference)
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

2. **New API Endpoints**: `/api/showcases`
   - Public endpoint to fetch active showcases
   - Protected admin endpoints for CRUD operations

3. **Removed Files**:
   - `backend/src/controllers/facebookController.js`
   - `backend/src/routes/facebookRoutes.js`

### Frontend Changes

1. **New Admin Page**: `Showcase` at `/admin/showcase`
   - Full CRUD interface for managing showcase items
   - Toggle active/inactive status
   - Manage display order
   - Admin-only access

2. **Updated Public Website**:
   - `ServicesSlideshow.jsx` now fetches from `/api/showcases` instead of Facebook
   - Maintains the same UI/UX
   - Falls back to static content if API fails

3. **New Service**: `showcaseService.js`
   - Replaces `facebookService.js`
   - Handles all showcase API interactions

4. **Removed Files**:
   - `front/src/services/facebookService.js`

## Database Migration

### Step 1: Run Database Migration

```bash
cd backend
npm run db:push
```

This will create the new `showcase` table in your database.

### Step 2: Verify Table Creation

Connect to your PostgreSQL database and verify:

```sql
\d showcase
```

You should see the showcase table with all columns.

## Environment Variables

### Removed (No Longer Needed)
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_ACCESS_TOKEN`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`

You can safely remove these from your `.env` file if they exist.

## Usage

### Adding Showcase Items (Admin)

1. Log in to the admin panel at `http://localhost:5173/admin`
2. Navigate to **Content > Showcase** in the sidebar
3. Click **"Add Showcase"**
4. Fill in the form:
   - **Title**: Main heading (required)
   - **Tagline**: Short subtitle (optional)
   - **Description**: Full description (required)
   - **Image URL**: Direct link to an image (optional)
   - **External Link**: URL for "Read More" button (optional)
   - **Display Order**: Number for sorting (higher = appears first)
5. Click **"Create Showcase"**

### Managing Showcases

- **Edit**: Click the pencil icon to update showcase details
- **Toggle Status**: Click the eye icon to activate/deactivate
- **Delete**: Click the trash icon to permanently remove

### Public Display

Active showcases are automatically displayed on the website in the "Building a Resilient Cebu" section. The system shows up to 6 showcases, ordered by `displayOrder` (descending) then by creation date.

## Fallback Behavior

If the API fails or no showcases exist, the website automatically falls back to hardcoded static events (same as before) to ensure the section is never empty.

## Benefits Over Facebook Integration

✅ **Full Control**: Curate exactly what appears on your website  
✅ **No Dependencies**: No reliance on Facebook API or access tokens  
✅ **No Rate Limits**: Unlimited requests to your own API  
✅ **Better SEO**: Images and content on your domain  
✅ **Custom Ordering**: Control the sequence of showcases  
✅ **Offline Capable**: Works even if external services are down  
✅ **Flexibility**: Add any content, not just social media posts  

## Testing

1. **Test Admin Panel**:
   - Create a test showcase
   - Edit it
   - Toggle its status
   - Delete it

2. **Test Public Website**:
   - Visit the homepage
   - Scroll to "Building a Resilient Cebu" section
   - Verify showcases appear
   - Test the "Read More" link (if added)

3. **Test Fallback**:
   - Stop the backend server
   - Refresh the website
   - Verify fallback static events appear

## Troubleshooting

### Showcase table not found
**Solution**: Run `npm run db:push` in the backend directory

### Admin page shows blank
**Solution**: Check browser console for errors. Ensure you're logged in as an admin user.

### Images not showing
**Solution**: Verify the image URL is publicly accessible and returns an image

### Changes not appearing on website
**Solution**: 
1. Check if showcase is marked as "Active"
2. Clear browser cache
3. Verify API is returning data: `http://localhost:5000/api/showcases`

## Migration Checklist

- [ ] Run database migration (`npm run db:push`)
- [ ] Remove Facebook environment variables from `.env` (optional)
- [ ] Create initial showcase items in admin panel
- [ ] Test showcase creation/editing
- [ ] Verify showcases appear on public website
- [ ] Test fallback behavior
- [ ] Update any deployment scripts if needed

## Support

For issues or questions, check:
- Backend logs for API errors
- Browser console for frontend errors
- Database connection and table structure
- User permissions (admin role required)
