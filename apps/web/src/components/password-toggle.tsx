export function PasswordToggle({
  show,
  onToggle,
}: {
  show: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Hide password" : "Show password"}
      className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
    >
      {show ? "Hide" : "Show"}
    </button>
  )
}
