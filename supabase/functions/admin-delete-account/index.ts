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

  // Cliente con el JWT de quien llama, solo para averiguar quien es --
  // igual que delete-account, la identidad nunca sale del token, nunca
  // del body.
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_ANON_KEY"),
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user: caller }, error: callerError } = await userClient.auth.getUser();

  if (callerError || !caller) {
    return new Response(JSON.stringify({ error: "Sesión inválida o expirada." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Cliente aparte con la service role key: unico que puede leer/escribir
  // sin RLS y llamar auth.admin.deleteUser. Nunca se expone al frontend.
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  const { data: callerProfile, error: callerProfileError } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", caller.id)
    .single();

  if (callerProfileError || !callerProfile?.is_admin) {
    return new Response(JSON.stringify({ error: "No autorizado." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const targetUserId = body?.user_id;

  if (!targetUserId || typeof targetUserId !== "string") {
    return new Response(JSON.stringify({ error: "Falta el id del usuario a eliminar." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (targetUserId === caller.id) {
    return new Response(JSON.stringify({ error: "No puedes eliminar tu propia cuenta desde aquí." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Si tiene una suscripcion de PayPal activa, cancelarla ANTES de borrar
  // la cuenta -- mismo motivo que delete-account: de lo contrario PayPal
  // le sigue cobrando cada mes a una cuenta que ya no existe.
  const { data: targetProfile } = await adminClient
    .from("profiles")
    .select("paypal_subscription_id, plan_cancelled")
    .eq("id", targetUserId)
    .single();

  if (targetProfile?.paypal_subscription_id && !targetProfile.plan_cancelled) {
    const cancelResponse = await paypalFetch(
      `/v1/billing/subscriptions/${targetProfile.paypal_subscription_id}/cancel`,
      {
        method: "POST",
        body: JSON.stringify({ reason: "Cuenta eliminada por un administrador en MyPinky." }),
      }
    );

    if (!cancelResponse.ok && cancelResponse.status !== 204) {
      const errorData = await cancelResponse.json().catch(() => null);
      console.error("Error cancelando suscripción antes de eliminar la cuenta:", errorData);
      return new Response(
        JSON.stringify({
          error: "No se pudo cancelar la suscripción activa de este usuario. Cancélala manualmente antes de eliminar la cuenta.",
          code: "subscription_cancel_failed",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // profiles.id -> auth.users.id tiene ON DELETE CASCADE, y de ahi
  // cascadea a matches/messages/swipes/favorites/reports/special_touches/
  // profile_visits/notification_views -- todo eso se limpia solo. Estas
  // tres tablas NO tienen cascada hacia profiles y bloquearian el borrado
  // con un error de llave foranea si se dejan sin limpiar primero.
  const { error: verificationDeleteError } = await adminClient
    .from("verification_requests")
    .delete()
    .eq("user_id", targetUserId);

  if (verificationDeleteError) {
    console.error("Error borrando verification_requests:", verificationDeleteError.message);
    return new Response(JSON.stringify({ error: "No se pudo limpiar el historial de verificación." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Defensivo: si esta cuenta alguna vez reviso la verificacion de otra
  // persona (reviewed_by), esa solicitud ajena no se borra -- solo se le
  // quita la referencia a quien la reviso.
  const { error: reviewedByError } = await adminClient
    .from("verification_requests")
    .update({ reviewed_by: null })
    .eq("reviewed_by", targetUserId);

  if (reviewedByError) {
    console.error("Error limpiando reviewed_by en verification_requests:", reviewedByError.message);
    return new Response(JSON.stringify({ error: "No se pudo limpiar el historial de verificación." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: purchaseIntentsError } = await adminClient
    .from("purchase_intents")
    .delete()
    .eq("user_id", targetUserId);

  if (purchaseIntentsError) {
    console.error("Error borrando purchase_intents:", purchaseIntentsError.message);
    return new Response(JSON.stringify({ error: "No se pudo limpiar el historial de compras." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: subscriptionPaymentsError } = await adminClient
    .from("subscription_payments")
    .delete()
    .eq("user_id", targetUserId);

  if (subscriptionPaymentsError) {
    console.error("Error borrando subscription_payments:", subscriptionPaymentsError.message);
    return new Response(JSON.stringify({ error: "No se pudo limpiar el historial de pagos." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);

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
