import { supabase } from "./supabaseClient";

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 14; // ~20s -- el webhook suele llegar en 1-5s, esto deja margen amplio

// El webhook de PayPal es la unica fuente de verdad que marca una compra
// como cumplida -- este polling solo espera a que ese resultado llegue,
// nunca decide nada por su cuenta. Si se agota el tiempo, el pago ya se
// cobro de todos modos, asi que nunca se trata como error.
export async function pollPurchaseIntent(purchaseIntentId) {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const { data } = await supabase
      .from("purchase_intents")
      .select("status, failure_reason")
      .eq("id", purchaseIntentId)
      .single();

    if (data?.status === "fulfilled") {
      return { outcome: "fulfilled" };
    }

    if (data?.status === "failed") {
      return { outcome: "failed", reason: data.failure_reason };
    }
  }

  return { outcome: "pending" };
}
