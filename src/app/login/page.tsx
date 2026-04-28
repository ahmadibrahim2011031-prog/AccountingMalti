// src/app/login/page.tsx - Root level login route  
import { redirect } from "next/navigation"

export default function LoginPage() {
  // Redirect to the actual login page
  redirect("/pages/login")
}
