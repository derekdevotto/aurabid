"use client";

import { PayPalOneTimePaymentButton, type OnApproveDataOneTimePayments } from "@paypal/react-paypal-js/sdk-v6";

type PayPalCheckoutProps = {
  points: number;
  onSuccess: (points: number, balance?: number) => void;
  onError: (message: string) => void;
};

export default function PayPalCheckout({ points, onSuccess, onError }: PayPalCheckoutProps) {
  async function createOrder() {
    const response = await fetch("/api/paypal/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
    });
    const data = await response.json() as { id?: string; error?: string };
    if (!response.ok || !data.id) throw new Error(data.error || "No se pudo crear la orden de PayPal.");
    return { orderId: data.id };
  }

  async function captureOrder(data: OnApproveDataOneTimePayments) {
    const response = await fetch(`/api/paypal/orders/${data.orderId}/capture`, { method: "POST" });
    const result = await response.json() as { status?: string; points?: number; balance_points?: number; error?: string };
    if (!response.ok || result.status !== "COMPLETED") throw new Error(result.error || "PayPal no pudo capturar el pago.");
    onSuccess(Number(result.points) || 0, Number(result.balance_points) || undefined);
  }

  return <div className="paypal-button"><PayPalOneTimePaymentButton createOrder={createOrder} onApprove={captureOrder} onCancel={() => onError("Pago cancelado; tu saldo no cambió.")} onError={(error) => onError(error instanceof Error ? error.message : "PayPal devolvió un error.")} type="pay" presentationMode="auto" /></div>;
}
