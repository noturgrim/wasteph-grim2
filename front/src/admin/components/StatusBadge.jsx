/**
 * Reusable status badge component with soft pill design
 *
 * @param {string} status - Status value
 * @param {Object} colorMap - Optional custom color mapping
 *
 * Default color scheme (can be overridden):
 * - Blue: new, pending
 * - Purple: contacted, in-progress
 * - Green: qualified, active
 * - Emerald: converted, completed
 * - Red: closed, suspended, cancelled
 * - Yellow: invited, on-hold
 */

const defaultColorMap = {
  // Inquiry statuses
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-purple-50 text-purple-700 border-purple-200",
  qualified: "bg-green-50 text-green-700 border-green-200",
  converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-red-50 text-red-700 border-red-200",

  // Lead statuses
  pending: "bg-blue-50 text-blue-700 border-blue-200",
  "in-progress": "bg-purple-50 text-purple-700 border-purple-200",
  "on-hold": "bg-yellow-50 text-yellow-700 border-yellow-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",

  // User/Generic statuses
  active: "bg-green-50 text-green-700 border-green-200",
  inactive: "bg-gray-50 text-gray-700 border-gray-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  invited: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

export function StatusBadge({ status, colorMap = {} }) {
  const mergedColorMap = { ...defaultColorMap, ...colorMap };
  const colorClass = mergedColorMap[status] || mergedColorMap.new;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {status}
    </span>
  );
}
