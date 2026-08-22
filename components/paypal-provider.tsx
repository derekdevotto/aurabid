"use client";

import { PayPalProvider } from "@paypal/react-paypal-js/sdk-v6";

export default function PayPalContext({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const environment = process.env.NEXT_PUBLIC_PAYPAL_ENV === "production" || process.env.NEXT_PUBLIC_PAYPAL_ENV === "live" ? "production" : "sandbox";

  if (!clientId || clientId.startsWith("your_")) return <>{children}</>;

  return <PayPalProvider clientId={clientId} environment={environment} pageType="checkout">{children}</PayPalProvider>;
}
