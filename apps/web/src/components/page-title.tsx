// "Prefix _italic_" title treatment (Bricolage extrabold + Instrument Serif
// italic on the last word): "Welcome _back_", "Create _account_", "Set a new
// _password_", "Check your _email_", … Captures the pattern so pages don't
// repeat the className soup inline.
export function PageTitle({ prefix, italic }: { prefix: string; italic: string }) {
  return (
    <>
      {prefix} <em className="font-serif font-normal italic">{italic}</em>
    </>
  )
}
