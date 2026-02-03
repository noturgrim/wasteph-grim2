/**
 * Reusable status badge component with soft pill design
 * Temperature-based color coding:
 *
 * 🔵 COLD (Blue) - Needs information gathering:
 *    - initial_comms, waiting_for_feedback, submitted_company_profile
 *
 * 🟠 WARM (Orange) - In progress, actively working:
 *    - to_call
 *
 * 🟡 AWAITING RESPONSE (Yellow) - Sent to client, waiting:
 *    - submitted_proposal
 *
 * 🟣 HOT (Purple/Red) - Information gathered, ready to close:
 *    - negotiating, proposal_created
 *
 * ✅ WON (Green) - Deal closed:
 *    - on_boarded
 *
 * ⚫ NEUTRAL (Gray) - Inactive/Closed:
 *    - na
 *
 * 🔴 LOST (Red) - Explicitly declined / lost:
 *    - declined
 */

const defaultColorMap = {
  // COLD - Needs information (Blue)
  initial_comms:
    "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700",
  waiting_for_feedback:
    "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700",
  submitted_company_profile:
    "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700",

  // WARM - In progress (Orange)
  to_call:
    "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700",

  // AWAITING RESPONSE (Yellow)
  submitted_proposal:
    "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700",

  // HOT - Ready to close (Purple/Red)
  negotiating:
    "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700",
  proposal_created:
    "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700",

  // WON - Deal closed (Green)
  on_boarded:
    "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700",

  // NEUTRAL - Inactive/Closed (Gray)
  na: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",

  // LOST - Explicitly declined (Red)
  declined:
    "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700",

  // Lead statuses
  new: "bg-blue-100 text-blue-700 border-blue-300",
  contacted: "bg-purple-100 text-purple-700 border-purple-300",
  proposal_sent: "bg-blue-100 text-blue-700 border-blue-300",
  won: "bg-green-100 text-green-700 border-green-300",
  lost: "bg-red-100 text-red-700 border-red-300",

  // User/Generic statuses
  active: "bg-green-100 text-green-700 border-green-300",
  inactive: "bg-gray-100 text-gray-700 border-gray-300",
  suspended: "bg-red-100 text-red-700 border-red-300",

  // Proposal statuses
  pending:
    "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700",
  approved:
    "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700",
  disapproved:
    "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700",
  sent:
    "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700",
  accepted:
    "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700",
  rejected:
    "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700",
  expired:
    "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
};

const statusLabels = {
  // Inquiry statuses
  proposal_created: "Proposal Created",
  submitted_proposal: "Proposal Sent",
  initial_comms: "Initial Comms",
  negotiating: "Negotiating",
  to_call: "To Call",
  submitted_company_profile: "Submitted Company Profile",
  na: "N/A",
  waiting_for_feedback: "Waiting for Feedback",
  declined: "Declined",
  on_boarded: "On Boarded",

  // Lead statuses
  new: "New",
  contacted: "Contacted",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",

  // User/Generic statuses
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",

  // Proposal statuses
  pending: "Pending Review",
  approved: "Approved",
  disapproved: "Disapproved",
  sent: "Sent to Client",
  accepted: "Client Accepted",
  rejected: "Client Rejected",
  expired: "Expired",
};

export function StatusBadge({ status, colorMap = {} }) {
  const mergedColorMap = { ...defaultColorMap, ...colorMap };
  const colorClass = mergedColorMap[status] || mergedColorMap.initial_comms;
  const label = statusLabels[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {label}
    </span>
  );
}
