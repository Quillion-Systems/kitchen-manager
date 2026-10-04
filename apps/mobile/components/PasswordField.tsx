import { useState } from "react"
import { Field, type FieldProps } from "./Field"
import { PasswordToggle } from "./PasswordToggle"

// Password inputs always carry two bits of friction when inlined: a
// show/hide boolean and the PasswordToggle wiring in rightSlot. This
// primitive owns both.
export type PasswordFieldProps = Omit<FieldProps, "secureTextEntry" | "rightSlot"> & {
  toggleTestID?: string
}

export function PasswordField({ toggleTestID, ...props }: PasswordFieldProps) {
  const [show, setShow] = useState(false)
  return (
    <Field
      secureTextEntry={!show}
      autoCapitalize="none"
      autoCorrect={false}
      rightSlot={
        <PasswordToggle testID={toggleTestID} show={show} onToggle={() => setShow((s) => !s)} />
      }
      {...props}
    />
  )
}
