import { Link } from "@tanstack/react-router"
import { type ReactNode, useState } from "react"
import { Alert } from "#/components/alert"
import { AuthShell } from "#/components/auth-shell"
import { Button } from "#/components/button"
import { PageTitle } from "#/components/page-title"
import { resendVerificationEmail } from "#/lib/auth-client"

// Shown after sign-up and reused when an unverified user tries to sign in: the
// account exists but is gated until the emailed link is clicked. Offers a
// resend so the user has a path forward if the mail didn't arrive.
export function CheckYourEmail({
  email,
  title = <PageTitle prefix="Check your" italic="email" />,
}: {
  email: string
  title?: ReactNode
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function onResend() {
    setStatus("sending")
    const result = await resendVerificationEmail(email)
    setStatus(result.error ? "error" : "sent")
  }

  return (
    <AuthShell
      title={title}
      subtitle={
        <>
          We sent a verification link to{" "}
          <span className="font-semibold text-foreground">{email}</span>. Click it to activate your
          account.
        </>
      }
      headerRight={
        <Link
          to="/sign-in"
          className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
        >
          Back to sign in
        </Link>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-base text-muted-foreground">
          Didn't get it? Check spam, or resend below.
        </p>
        {status === "error" ? (
          <Alert message="Couldn't resend right now. Try again in a moment." />
        ) : null}
        <Button
          variant="secondary"
          loading={status === "sending"}
          disabled={status === "sent"}
          onClick={onResend}
          className="w-full"
        >
          {status === "sent" ? "Sent — check your inbox" : "Resend email"}
        </Button>
      </div>
    </AuthShell>
  )
}
