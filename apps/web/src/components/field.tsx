import { type ReactNode, useId } from "react"
import { Input, type InputProps } from "./input"

export type FieldProps = Omit<InputProps, "id"> & {
  id?: string
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

export function Field({
  label,
  hint,
  error,
  id: idProp,
  ...inputProps
}: FieldProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const errorId = `${id}-err`
  const hintId = `${id}-hint`
  const describedBy = error ? errorId : hint ? hintId : undefined
  const invalid = !!error

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-sans text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <Input
        id={id}
        invalid={invalid}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
