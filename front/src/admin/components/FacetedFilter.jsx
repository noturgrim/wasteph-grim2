import { PlusCircle, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Reusable multi-select faceted filter component
 *
 * @param {string} title - Filter title (e.g., "Status", "Source")
 * @param {Array} options - Array of option objects: [{ value: "new", label: "New" }] or strings
 * @param {Array} selectedValues - Array of currently selected values
 * @param {Function} onSelectionChange - Callback when selection changes
 * @param {Function} getCount - Optional function to get count for each option
 */
export function FacetedFilter({
  title,
  options = [],
  selectedValues = [],
  onSelectionChange,
  getCount,
}) {
  // Normalize options to always have value and label
  const normalizedOptions = options.map(opt =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const handleSelect = (value) => {
    const isSelected = selectedValues.includes(value);
    const newValues = isSelected
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newValues);
  };

  const handleClear = () => {
    onSelectionChange([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.length > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.length} selected
                  </Badge>
                ) : (
                  selectedValues.map((value) => {
                    const option = normalizedOptions.find(opt => opt.value === value);
                    return (
                      <Badge
                        variant="secondary"
                        key={value}
                        className="rounded-sm px-1 font-normal capitalize"
                      >
                        {option?.label || value}
                      </Badge>
                    );
                  })
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {normalizedOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div
                      className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input"
                      }`}
                    >
                      {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                    </div>
                    <span className="capitalize flex-1">
                      {option.label.replace("-", " ")}
                    </span>
                    {getCount && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {getCount(option.value)}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClear}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
