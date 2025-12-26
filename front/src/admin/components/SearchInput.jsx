import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Reusable search input component with icon
 *
 * @param {string} value - Current search value
 * @param {Function} onChange - Callback when value changes
 * @param {string} placeholder - Placeholder text
 * @param {string} className - Additional classes
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) {
  return (
    <div className={`relative max-w-sm ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
