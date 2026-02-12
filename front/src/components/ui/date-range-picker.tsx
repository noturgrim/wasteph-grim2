"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRangePickerProps {
  value?: DateRange | undefined
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  align?: "start" | "center" | "end"
  fromYearOffset?: number
  toYearOffset?: number
}

export const DateRangePicker = React.forwardRef<
  HTMLButtonElement,
  DateRangePickerProps
>(
  (
    {
      value,
      onChange,
      placeholder = "Filter by date range",
      disabled = false,
      className,
      align = "start",
      fromYearOffset = 10,
      toYearOffset = 10,
    },
    ref
  ) => {
    const label =
      value?.from && value?.to
        ? `${format(value.from, "MMM d, yyyy")} – ${format(
            value.to,
            "MMM d, yyyy"
          )}`
        : value?.from
        ? `${format(value.from, "MMM d, yyyy")} – …`
        : undefined

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !label && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {label ?? <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            numberOfMonths={1}
            fromYear={new Date().getFullYear() - fromYearOffset}
            toYear={new Date().getFullYear() + toYearOffset}
            captionLayout="dropdown"
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  }
)

DateRangePicker.displayName = "DateRangePicker"

