"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0")
);

const parseTime = (value: string): { hour: number; minute: number; period: "am" | "pm" } | null => {
  if (!value || !/^\d{1,2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
    const period = h < 12 ? "am" : "pm";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { hour: hour12, minute: m, period };
  }
  return null;
};

const formatTime = (hour: number, minute: number, period: "am" | "pm"): string => {
  const hour24 = period === "am" ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
  return `${hour24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
};

const formatDisplay = (value: string): string => {
  const parsed = parseTime(value);
  if (!parsed) return "";
  const { hour, minute, period } = parsed;
  return `${hour}:${minute.toString().padStart(2, "0")} ${period.toUpperCase()}`;
};

export const TimePicker = React.forwardRef<HTMLButtonElement, TimePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = "Select time",
      disabled = false,
      className,
      align = "start",
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const parsed = parseTime(value || "") ?? {
      hour: 12,
      minute: 0,
      period: "am" as const,
    };
    const [hour, setHour] = React.useState(parsed.hour);
    const [minute, setMinute] = React.useState(parsed.minute);
    const [period, setPeriod] = React.useState<"am" | "pm">(parsed.period);

    React.useEffect(() => {
      const p = parseTime(value || "");
      if (p) {
        setHour(p.hour);
        setMinute(p.minute);
        setPeriod(p.period);
      }
    }, [value]);

    const handleApply = () => {
      const timeStr = formatTime(hour, minute, period);
      onChange?.(timeStr);
      setOpen(false);
    };

    const displayValue = value ? formatDisplay(value) : null;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <Clock className="mr-2 h-4 w-4 shrink-0" />
            {displayValue || <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex border-b">
            <ScrollArea className="h-[180px] w-16">
              <div className="p-2 space-y-0.5">
                {HOURS_12.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour(h)}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors",
                      hour === h && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 font-medium"
                    )}
                  >
                    {h.toString().padStart(2, "0")}
                  </button>
                ))}
              </div>
            </ScrollArea>
            <ScrollArea className="h-[180px] w-16 border-l">
              <div className="p-2 space-y-0.5">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinute(parseInt(m, 10))}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors",
                      minute === parseInt(m, 10) &&
                        "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 font-medium"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </ScrollArea>
            <div className="h-[180px] w-14 border-l flex flex-col p-2 gap-1">
              {(["am", "pm"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "flex-1 min-h-[36px] rounded-md px-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                    period === p && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 font-medium"
                  )}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="p-2 border-t flex justify-end">
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

TimePicker.displayName = "TimePicker";
