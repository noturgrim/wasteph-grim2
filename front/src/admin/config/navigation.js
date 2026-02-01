import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  TrendingUp,
  Settings,
  UserCog,
  UserCheck,
  BookOpen,
  FileEdit,
  ScrollText,
  Image,
  FileSignature,
  Calendar,
} from "lucide-react";

/**
 * Navigation configuration for different user roles
 *
 * Roles:
 * - super_admin: Full access to everything (Management, Content, Administration)
 * - admin: Management access (Proposals, Contracts, Clients) — no Content or Administration
 * - social_media: Content management (Blog Posts, Showcase, Clients Showcase)
 * - sales: Access to sales pipeline only
 */

// Sales Pipeline items (accessible by both roles)
// Order: Leads (pool) → Inquiries (claimed) → Clients
const salesPipelineItems = [
  {
    title: "Leads",
    url: "/admin/leads",
    icon: TrendingUp,
    description: "Lead pool for claiming",
  },
  {
    title: "Inquiries",
    url: "/admin/inquiries",
    icon: UserPlus,
    description: "Claimed leads and inquiries",
  },
  {
    title: "Clients",
    url: "/admin/clients",
    icon: Users,
    description: "Contracted clients",
  },
];

/**
 * Get navigation items based on user role and isMasterSales flag
 * @param {string} role - User role (admin or staff for sales)
 * @param {boolean} isMasterSales - Whether user is a master sales
 * @returns {Array} Navigation groups
 */
export const getNavigationByRole = (role, isMasterSales = false) => {
  const baseNavigation = [
    {
      label: "General",
      items: [
        {
          title: "Dashboard",
          url: "/admin/dashboard",
          icon: LayoutDashboard,
          description: "Overview and statistics",
        },
        {
          title: "Calendar",
          url: "/admin/calendar",
          icon: Calendar,
          description: "Manage your schedule",
        },
      ],
    },
    {
      label: "Sales Pipeline",
      items: salesPipelineItems,
    },
    {
      label: "Contracts",
      items: [
        {
          title: "Contract Requests",
          url: "/admin/contract-requests",
          icon: FileSignature,
          description: "Manage contract requests",
        },
      ],
    },
  ];

  // Master Sales gets Tools section
  if (isMasterSales) {
    baseNavigation.push({
      label: "Tools",
      items: [
        {
          title: "Proposal Templates",
          url: "/admin/proposal-templates",
          icon: FileEdit,
          description: "Manage proposal templates",
        },
      ],
    });
  }

  // Super Admin gets full access to everything
  if (role === "super_admin") {
    return [
      {
        label: "General",
        items: [
          {
            title: "Dashboard",
            url: "/admin/dashboard",
            icon: LayoutDashboard,
            description: "Overview and statistics",
          },
        ],
      },
      {
        label: "Management",
        items: [
          {
            title: "Proposals",
            url: "/admin/proposals",
            icon: ScrollText,
            description: "Review and approve proposals",
          },
          {
            title: "Contract Requests",
            url: "/admin/contract-requests",
            icon: FileSignature,
            description: "Manage contract requests",
          },
          {
            title: "Contract Templates",
            url: "/admin/contract-templates",
            icon: FileSignature,
            description: "Manage contract templates",
          },
          {
            title: "Clients",
            url: "/admin/clients",
            icon: UserCheck,
            description: "Manage contracted clients",
          },
        ],
      },
      {
        label: "Content",
        items: [
          {
            title: "Blog Posts",
            url: "/admin/blog",
            icon: BookOpen,
            description: "Manage blog content",
          },
          {
            title: "Showcase",
            url: "/admin/showcase",
            icon: Image,
            description: "Manage community showcase",
          },
          {
            title: "Clients Showcase",
            url: "/admin/clients-showcase",
            icon: Users,
            description: "Manage client success stories",
          },
        ],
      },
      {
        label: "Administration",
        items: [
          {
            title: "User Management",
            url: "/admin/users",
            icon: UserCog,
            description: "Manage system users",
          },
          {
            title: "Settings",
            url: "/admin/settings",
            icon: Settings,
            description: "System configuration",
          },
        ],
      },
    ];
  }

  // Social Media gets Dashboard + Content only
  if (role === "social_media") {
    return [
      {
        label: "General",
        items: [
          {
            title: "Dashboard",
            url: "/admin/dashboard",
            icon: LayoutDashboard,
            description: "Overview and statistics",
          },
        ],
      },
      {
        label: "Content",
        items: [
          {
            title: "Blog Posts",
            url: "/admin/blog",
            icon: BookOpen,
            description: "Manage blog content",
          },
          {
            title: "Showcase",
            url: "/admin/showcase",
            icon: Image,
            description: "Manage community showcase",
          },
          {
            title: "Clients Showcase",
            url: "/admin/clients-showcase",
            icon: Users,
            description: "Manage client success stories",
          },
        ],
      },
    ];
  }

  // Admin gets Management only (no Content, no Administration)
  if (role === "admin") {
    return [
      {
        label: "General",
        items: [
          {
            title: "Dashboard",
            url: "/admin/dashboard",
            icon: LayoutDashboard,
            description: "Overview and statistics",
          },
        ],
      },
      {
        label: "Management",
        items: [
          {
            title: "Proposals",
            url: "/admin/proposals",
            icon: ScrollText,
            description: "Review and approve proposals",
          },
          {
            title: "Contract Requests",
            url: "/admin/contract-requests",
            icon: FileSignature,
            description: "Manage contract requests",
          },
          {
            title: "Contract Templates",
            url: "/admin/contract-templates",
            icon: FileSignature,
            description: "Manage contract templates",
          },
          {
            title: "Clients",
            url: "/admin/clients",
            icon: UserCheck,
            description: "Manage contracted clients",
          },
        ],
      },
    ];
  }

  // Sales role (staff) gets only sales pipeline (+ Tools if master sales)
  return baseNavigation;
};

/**
 * Check if user has access to a specific route
 * @param {string} role - User role
 * @param {string} path - Route path
 * @param {boolean} isMasterSales - Whether user is master sales
 * @returns {boolean} Whether user has access
 */
export const hasAccess = (role, path, isMasterSales = false) => {
  const navigation = getNavigationByRole(role, isMasterSales);
  const allItems = navigation.flatMap(group => group.items);
  return allItems.some(item => path.startsWith(item.url));
};

/**
 * Get default route for a role
 * @param {string} role - User role
 * @returns {string} Default route
 */
export const getDefaultRoute = (role) => {
  return "/admin/dashboard";
};
