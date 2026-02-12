# Admin Analytics Dashboard

## Overview

The Admin Analytics Dashboard provides comprehensive business intelligence for super admin and admin users. It tracks key performance indicators across three major areas: conversion funnel, business growth, and ticket system performance.

**Access:** Available to users with `admin` or `super_admin` roles via Dashboard → Analytics tab.

**Real-time Updates:** All analytics automatically refresh when relevant data changes (tickets, proposals, contracts, leads) via WebSocket events.

---

## Analytics Sections

### 1. Conversion Funnel

Tracks the customer journey from initial inquiry through to signed contract, revealing conversion rates at each stage.

#### Metrics

**Pipeline Stages:**
- **Inquiries** → Total inquiries received
- **Leads** → Inquiries converted to qualified leads
- **Proposals Sent** → Proposals sent to leads (statuses: sent, accepted, rejected)
- **Contracts Signed** → Proposals that resulted in signed contracts

**Conversion Rates:**
- **Inquiry → Lead:** Percentage of inquiries that become leads
- **Lead → Proposal:** Percentage of leads that receive proposals
- **Proposal → Contract:** Percentage of proposals that result in signed contracts
- **Overall Conversion:** End-to-end conversion rate (inquiries → signed contracts)

**Inquiry Sources:**
- Breakdown of where inquiries originate (e.g., website, referral, social media)
- Horizontal bar chart showing count per source
- Helps identify most effective lead generation channels

#### Use Cases

- **Identify bottlenecks:** Low conversion at a specific stage indicates where the sales process needs improvement
- **Channel optimization:** See which inquiry sources produce the highest quality leads
- **Sales forecasting:** Predict future contracts based on current funnel volume and conversion rates
- **Process improvement:** Track how changes to sales process affect conversion rates over time

---

### 2. Business Growth

Tracks client acquisition and contract performance metrics.

#### Client Growth Metrics

**Total Clients:**
- Overall count of clients in the system

**Client Status Distribution:**
- **Active:** Clients with active contracts
- **Inactive:** Clients with no current active contracts
- **Suspended:** Clients whose access has been suspended
- Visual progress bar showing active vs. inactive ratio

**New Clients:**
- **This Month:** Number of new clients added in current month
- **Growth Rate:** Percentage change compared to last month
  - Green indicator with ↑ for positive growth
  - Red indicator with ↓ for negative growth

#### Contract Performance Metrics

**Total Signed Contracts:**
- Count of all contracts with status = "signed"

**Contract Type Distribution:**
- Breakdown by contract type (e.g., one-time, recurring, project-based)
- Horizontal bar chart showing count per type
- Helps understand service mix

**6-Month Trend:**
- Line chart showing signed contracts per month over last 6 months
- Reveals seasonality and growth trends
- Format: YYYY-MM grouping

**Contracts Ending Soon:**
- Count of contracts expiring in next 30 days
- Warning indicator (amber) to proactively manage renewals
- Helps prevent churn and plan renewal outreach

#### Use Cases

- **Monitor growth:** Track if client base is expanding or contracting
- **Prevent churn:** Identify contracts ending soon for renewal campaigns
- **Service planning:** Understand which contract types are most popular
- **Revenue forecasting:** Project future revenue based on contract trends
- **Retention analysis:** Compare new clients vs. contract expirations

---

### 3. Ticket Analytics

Comprehensive support system metrics tracking ticket volume, resolution performance, and workload distribution.

#### Key Performance Indicators (KPIs)

**Average Resolution Time:**
- Mean time (in hours) from ticket creation to resolution
- Calculated only for tickets with status = "resolved"
- Lower is better; indicates support efficiency

**Recently Resolved:**
- Count of tickets resolved in last 7 days
- Shows team productivity

**Aging Tickets:**
- Count of open/in_progress tickets older than 48 hours
- Warning indicator for tickets that need attention
- Helps prevent SLA violations

#### Status Distribution

Pie chart showing ticket count by status:
- **Open** (amber) - New tickets awaiting assignment
- **In Progress** (blue) - Tickets actively being worked on
- **Resolved** (green) - Tickets successfully resolved
- **Closed** (gray) - Tickets closed and archived

#### Priority Distribution

Pie chart showing ticket count by priority:
- **Low** (green) - Non-urgent issues
- **Medium** (blue) - Standard priority
- **High** (amber) - Important issues requiring quick attention
- **Urgent** (red) - Critical issues requiring immediate action

#### 6-Month Trend

Area chart comparing tickets created vs. resolved over 6 months:
- **Created** (blue area) - Tickets opened each month
- **Resolved** (green area) - Tickets resolved each month
- Helps identify if backlog is growing or shrinking
- Format: YYYY-MM grouping

#### Top Categories

Horizontal bar chart showing the 5 most common ticket categories:
- E.g., Technical Issue, Billing Inquiry, Service Request, etc.
- Category names automatically formatted (technical_issue → Technical Issue)
- Helps identify common pain points and training opportunities

#### Assignment Status

Shows workload distribution:
- **Assigned:** Tickets with a `resolvedBy` user assigned (green badge)
- **Unassigned:** Tickets without a resolver yet (amber badge)
- High unassigned count indicates need for more support coverage

#### Use Cases

- **SLA monitoring:** Track resolution times and aging tickets to meet service level agreements
- **Workload balancing:** Ensure tickets are being assigned and resolved promptly
- **Resource planning:** Identify if support team is keeping up with ticket volume
- **Training needs:** Most common categories reveal what issues users face most
- **Quality tracking:** Monitor resolution rates and identify trends
- **Escalation management:** Urgent and high-priority tickets need quick attention

---

## Technical Implementation

### Backend

**Endpoint:** `GET /api/dashboard/admin/analytics`

**Authorization:** Requires `requireAuth` + `requireRole("admin", "super_admin")`

**Service Method:** `DashboardService.getAdminAnalyticsDashboard()`

**Query Strategy:**
- All analytics queries run in parallel using `Promise.all()` for optimal performance
- Data aggregated using SQL `count()`, `sum()`, `avg()`, and `to_char()` for time grouping
- Uses Drizzle ORM with PostgreSQL-specific functions

**Time Windows:**
- 6-month historical data for trends
- 7-day window for recent activity
- 48-hour threshold for aging tickets
- 30-day lookahead for expiring contracts

### Frontend

**Component:** `AdminAnalyticsDashboard.jsx`

**Sub-components:**
- `ConversionFunnelSection.jsx` - Funnel and source charts
- `BusinessGrowthSection.jsx` - Client and contract cards
- `TicketAnalyticsSection.jsx` - Comprehensive ticket metrics

**Charts:** Recharts library via shadcn/ui chart components
- Pie charts (status, priority distribution)
- Area charts (monthly trends)
- Bar charts (sources, categories, contract types)
- Line charts (contract trends)

**Real-time Updates:**
- Socket events trigger silent data refresh (no loading state)
- Events: `ticket:created`, `ticket:updated`, `proposal:sent`, `proposal:accepted`, `contract:signed`, `lead:created`
- Stale fetch protection using `fetchIdRef` to prevent race conditions

**Color Theme:**
- Green (`hsl(142, 76%, 36%)`) - Positive metrics (resolved, signed, active)
- Blue (`hsl(217, 91%, 60%)`) - Neutral/in-progress
- Amber (`hsl(45, 93%, 47%)`) - Warnings (aging, unassigned, open)
- Red (`hsl(0, 72%, 51%)`) - Urgent/critical

---

## Best Practices

### For Admins

1. **Daily Check:**
   - Review aging tickets to prevent SLA violations
   - Check contracts ending soon for renewal planning
   - Monitor unassigned tickets to ensure coverage

2. **Weekly Review:**
   - Analyze conversion funnel to identify bottlenecks
   - Review ticket categories to spot recurring issues
   - Check resolution times to maintain service quality

3. **Monthly Analysis:**
   - Compare month-over-month growth rates
   - Review 6-month trends for strategic planning
   - Assess inquiry sources for marketing effectiveness

### Interpreting Data

**Healthy Indicators:**
- ✅ Conversion funnel rates improving or stable
- ✅ Client growth rate positive
- ✅ Tickets resolved ≥ tickets created (trend chart)
- ✅ Low aging ticket count
- ✅ Average resolution time decreasing or stable
- ✅ Low unassigned ticket count

**Warning Signs:**
- ⚠️ Conversion rates dropping at specific funnel stage
- ⚠️ Negative client growth rate
- ⚠️ Tickets created > tickets resolved consistently
- ⚠️ High or increasing aging ticket count
- ⚠️ Increasing average resolution time
- ⚠️ Many urgent/high priority tickets open

---

## Data Refresh

**Automatic Refresh Triggers:**
- New ticket created
- Ticket status/priority changed
- Proposal sent or responded to
- Contract signed
- Lead created or claimed

**Manual Refresh:**
- Switch between analytics tabs
- Navigate away and back to Analytics tab
- Hard refresh browser (Ctrl+Shift+R)

**Performance:**
- All queries optimized with database indexes
- Parallel query execution for fast loading
- Responsive charts with proper loading states

---

## Future Enhancements

Potential additions to analytics dashboard:

- **Revenue Analytics:** Total contract value, revenue trends, forecasting
- **Sales Performance:** Individual sales rep metrics, leaderboards
- **Customer Satisfaction:** Survey scores, NPS tracking
- **Response Time Metrics:** First response time, time to assignment
- **Geographic Analysis:** Client distribution by region
- **Seasonal Patterns:** Year-over-year comparisons
- **Export Functionality:** Download analytics data as CSV/PDF
- **Custom Date Ranges:** User-selectable time periods
- **Goal Tracking:** Set targets and track progress
- **Alerts/Notifications:** Automated alerts for concerning metrics

---

## Related Documentation

- **CLAUDE.md** - Project structure and development guidelines
- **SOCKET_IMPLEMENTATION.md** - Real-time WebSocket system details
- **Master Sales Analytics** - Similar analytics for sales users (Dashboard → Overview → Analytics tab)
