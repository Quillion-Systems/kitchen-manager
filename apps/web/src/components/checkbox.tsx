import { Check } from "lucide-react"
import type { InputHTMLAttributes, ReactNode } from "react"

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "checked" | "onChange" | "children"
> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children?: ReactNode
}

export function Checkbox({
  checked,
  onCheckedChange,
  children,
  className,
  disabled,
  ...rest
}: CheckboxProps) {
  const boxClasses = checked ? "bg-primary border-primary" : "bg-input-background border-input"
  return (
    <label
      className={`inline-flex items-center gap-3${disabled ? " cursor-not-allowed opacity-50" : " cursor-pointer"}${className ? ` ${className}` : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
        className="peer sr-only"
        {...rest}
      />
      <span
        aria-hidden="true"
        className={`grid size-6 place-items-center rounded-md border-[1.5px] transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-accent ${boxClasses}`}
      >
        {checked ? <Check className="size-4 text-accent" strokeWidth={3} /> : null}
      </span>
      {children ? <span className="text-sm font-medium text-foreground">{children}</span> : null}
    </label>
  )
}
