"use client";
import { signOut } from "next-auth/react";

/** Logger ut direkte og sender kunden til den norske innloggingssiden (ikke NextAuths engelske utloggingsside). */
export function SignOutButton() {
  return <button type="button" className="crm-btn-ghost text-sm" onClick={async () => { await signOut({ redirect: false }); window.location.assign("/customer/login"); }}>Logg ut</button>;
}
