import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { paypalFetch } from "../_shared/paypal.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Falta el token de autorización." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Client scoped to the caller's own JWT: identity comes from this token,
  // never from the request body, so this function can only ever delete the
  // account of whoever is calling it.
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_ANON_KEY"),
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await userClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Sesión inválida o expirada." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Separate admin client using the service role key: only this one can
  // call auth.admin.deleteUser, and it is never exposed to the frontend.
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  // Si tiene una suscripcion de PayPal activa, cancelarla ANTES de borrar
  // la cuenta -- de lo contrario PayPal sigue cobrando cada mes para
  // siempre, ya que nada mas le avisaria que la cuenta ya no existe.
  const { data: profile } = await adminClient
    .from("profiles")
    .select("paypal_subscription_id, plan_cancelled")
    .eq("id", user.id)
    .single();

  if (profile?.paypal_subscription_id && !profile.plan_cancelled) {
    const cancelResponse = await paypalFetch(
      `/v1/billing/subscriptions/${profile.paypal_subscription_id}/cancel`,
      {
        method: "POST",
        body: JSON.stringify({ reason: "Cuenta eliminada por el usuario en MyPinky." }),
      }
    );

    if (!cancelResponse.ok && cancelResponse.status !== 204) {
      const errorData = await cancelResponse.json().catch(() => null);
      console.error("Error cancelando suscripción antes de eliminar la cuenta:", errorData);
      return new Response(
        JSON.stringify({
          error: "No se pudo cancelar tu suscripción activa. Contacta a soporte antes de eliminar tu cuenta.",
          code: "subscription_cancel_failed",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
