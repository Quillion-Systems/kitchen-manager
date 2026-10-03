import { useState } from "react"
import { Field, type FieldProps } from "./field"
import { PasswordToggle } from "./password-toggle"

// Password inputs always carry two bits of friction when inlined: a
// show/hide boolean and the PasswordToggle wiring in rightSlot. This
// primitive owns both.
export type PasswordFieldProps = Omit<FieldProps, "type" | "rightSlot">

export function PasswordField(props: PasswordFieldProps) {
  const [show, setShow] = useState(false)
  return (
    <Field
      type={show ? "text" : "password"}
      rightSlot={<PasswordToggle show={show} onToggle={() => setShow((s) => !s)} />}
      {...props}
    />
  )
}
