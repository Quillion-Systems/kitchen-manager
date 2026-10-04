import type { InputHTMLAttributes, ReactNode } from "react"

export type SwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "checked" | "onChange" | "children"
> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children?: ReactNode
}

export function Switch({
  checked,
  onCheckedChange,
  children,
  className,
  disabled,
  ...rest
}: SwitchProps) {
  return (
    <label
      className={`inline-flex items-center justify-between gap-4${
        disabled ? " cursor-not-allowed opacity-50" : " cursor-pointer"
      }${className ? ` ${className}` : ""}`}
    >
      {children ? (
        <span className="text-base font-semibold text-foreground">{children}</span>
      ) : null}
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
        className="peer sr-only"
        {...rest}
      />
      <span
        aria-hidden="true"
        className={`relative h-8 w-[52px] shrink-0 rounded-full p-[3px] transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-accent ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`block size-[26px] rounded-full shadow-sm transition-transform ${
            checked ? "translate-x-5 bg-accent" : "translate-x-0 bg-input-background"
          }`}
        />
      </span>
    </label>
  )
}
