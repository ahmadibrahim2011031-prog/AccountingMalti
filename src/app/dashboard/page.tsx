// src/app/dashboard/page.tsx - Root level dashboard route
import { redirect } from "next/navigation"

export default function DashboardPage() {
  // Redirect to the actual dashboard page
  redirect("/pages/dashboard")
}
