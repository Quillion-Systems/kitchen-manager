import { createFileRoute, Link } from "@tanstack/react-router"
import { AdminShell } from "#/lib/admin-shell"

export const Route = createFileRoute("/admin/")({ component: AdminHome })

// Landing page for the admin dashboard. Just a directory of the sub-surfaces
// today (only Users lands in this PR); grows into a proper "operations
// dashboard" as more show up (households, feature flags, data explorer, ...).
function AdminHome() {
  return (
    <AdminShell>
      <ul className="space-y-2">
        <li>
          <Link
            to="/admin/users"
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 transition hover:border-neutral-700 hover:bg-neutral-800"
          >
            <span className="font-medium text-neutral-100">Users</span>
            <span className="text-sm text-neutral-500">
              list · ban · delete · resend verification
            </span>
          </Link>
        </li>
        <li className="flex items-center justify-between rounded-lg border border-dashed border-neutral-800 px-4 py-3 opacity-50">
          <span className="text-neutral-400">Households</span>
          <span className="text-xs text-neutral-600">soon</span>
        </li>
        <li className="flex items-center justify-between rounded-lg border border-dashed border-neutral-800 px-4 py-3 opacity-50">
          <span className="text-neutral-400">Feature flags</span>
          <span className="text-xs text-neutral-600">soon</span>
        </li>
      </ul>
    </AdminShell>
  )
}
