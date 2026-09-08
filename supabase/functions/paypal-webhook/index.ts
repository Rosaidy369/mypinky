import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { paypalFetch } from "../_shared/paypal.ts";

// PayPal llama esta funcion directamente -- no hay JWT de usuario, la
// unica autenticacion real es la verificacion de firma de abajo.
const PAYPAL_WEBHOOK_ID = Deno.env.get("PAYPAL_WEBHOOK_ID") || "";

// Mapeo de los 4 Plan IDs de PayPal a plan/ciclo -- variables de
// entorno de Supabase (no las VITE_ del frontend, aunque el valor sea
// el mismo Plan ID).
const PLAN_ID_MAP: Record<string, { plan: string; cycle: string }> = {
  [Deno.env.get("PAYPAL_PLAN_ID_PREMIUM_MONTHLY") || ""]: { plan: "premium", cycle: "monthly" },
  [Deno.env.get("PAYPAL_PLAN_ID_PREMIUM_ANNUAL") || ""]: { plan: "premium", cycle: "annual" },
  [Deno.env.get("PAYPAL_PLAN_ID_VIP_MONTHLY") || ""]: { plan: "vip", cycle: "monthly" },
  [Deno.env.get("PAYPAL_PLAN_ID_VIP_ANNUAL") || ""]: { plan: "vip", cycle: "annual" },
};

function addCycle(date: Date, cycle: string): Date {
  const result = new Date(date);
  if (cycle === "annual") {
    result.setFullYear(result.getFullYear() + 1);
  } else {
    result.setMonth(result.getMonth() + 1);
  }
  return result;
}

async function verifySignature(req: Request, rawBody: string): Promise<boolean> {
  const transmissionId = req.headers.get("paypal-transmission-id");
  const transmissionTime = req.headers.get("paypal-transmission-time");
  const certUrl = req.headers.get("paypal-cert-url");
  const authAlgo = req.headers.get("paypal-auth-algo");
  const transmissionSig = req.headers.get("paypal-transmission-sig");

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    console.error("Faltan headers de PayPal en la petición.", {
      transmissionId, transmissionTime, certUrl, authAlgo, transmissionSig,
    });
    return false;
  }

  // webhook_event debe llevar el JSON EXACTO, byte por byte, que PayPal
  // mando originalmente -- la firma se valida contra un CRC32 de esos
  // bytes. Si se re-serializa el objeto ya parseado (JSON.stringify),
  // el orden de las llaves o los espacios pueden cambiar y la
  // verificacion falla aunque el contenido sea "el mismo". Por eso se
  // arma el body a mano, empalmando rawBody tal cual en vez de volver
  // a construirlo desde el objeto ya parseado.
  const verifyBody =
    `{"transmission_id":${JSON.stringify(transmissionId)}` +
    `,"transmission_time":${JSON.stringify(transmissionTime)}` +
    `,"cert_url":${JSON.stringify(certUrl)}` +
    `,"auth_algo":${JSON.stringify(authAlgo)}` +
    `,"transmission_sig":${JSON.stringify(transmissionSig)}` +
    `,"webhook_id":${JSON.stringify(PAYPAL_WEBHOOK_ID)}` +
    `,"webhook_event":${rawBody}}`;

  const response = await paypalFetch("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: verifyBody,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("verify-webhook-signature respondió con error HTTP:", response.status, JSON.stringify(data));
    return false;
  }

  return data?.verification_status === "SUCCESS";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  let event: any;

  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido." }), { status: 400 });
  }

  const isValid = await verifySignature(req, rawBody, event);

  if (!isValid) {
    console.error("Firma de webhook inválida, evento rechazado:", event?.id);
    return new Response(JSON.stringify({ error: "Firma inválida." }), { status: 400 });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Dedup: PayPal puede reenviar el mismo evento mas de una vez. Si el
  // insert choca contra el unique de paypal_event_id (23505), ya se
  // proceso antes -- se responde 200 sin volver a hacer nada.
  const { data: insertedEvent, error: insertError } = await adminClient
    .from("payment_events")
    .insert({
      paypal_event_id: event.id,
      event_type: event.event_type,
      raw_payload: event,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return new Response(JSON.stringify({ duplicate: true }), { status: 200 });
    }
    console.error("Error guardando evento de webhook:", insertError.message);
    return new Response(JSON.stringify({ error: "Error interno." }), { status: 500 });
  }

  let processingError: string | null = null;

  try {
    await handleEvent(adminClient, event);
  } catch (err) {
    processingError = err instanceof Error ? err.message : String(err);
    console.error("Error procesando evento de webhook:", event.event_type, processingError);
  }

  await adminClient
    .from("payment_events")
    .update({ processed_at: new Date().toISOString(), processing_error: processingError })
    .eq("id", insertedEvent.id);

  // Siempre 200 una vez que el evento quedo guardado -- si el
  // cumplimiento fallo, el error ya vive en processing_error para
  // revisar a mano, en vez de dejar que PayPal reintente en bucle por
  // un bug de este lado.
  return new Response(JSON.stringify({ received: true }), { status: 200 });
});

async function handleEvent(adminClient: ReturnType<typeof createClient>, event: any) {
  const resource = event.resource || {};

  switch (event.event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      const planInfo = PLAN_ID_MAP[resource.plan_id];

      if (!planInfo) {
        throw new Error(`plan_id desconocido: ${resource.plan_id}`);
      }

      // custom_id deberia traer el user.id (se manda al crear la
      // suscripcion del lado del cliente). Si no llega -- a verificar
      // contra sandbox real -- se intenta resolver por si el frontend
      // ya llamo a link_paypal_subscription antes de que este evento
      // llegara.
      let userId = resource.custom_id;

      if (!userId) {
        const { data: linked } = await adminClient
          .from("profiles")
          .select("id")
          .eq("paypal_subscription_id", resource.id)
          .maybeSingle();
        userId = linked?.id;
      }

      if (!userId) {
        throw new Error(`No se pudo resolver el usuario para la suscripción ${resource.id}`);
      }

      const expiresAt = addCycle(new Date(), planInfo.cycle);

      const { error } = await adminClient
        .from("profiles")
        .update({
          plan: planInfo.plan,
          plan_billing_cycle: planInfo.cycle,
          plan_expires_at: expiresAt.toISOString(),
          plan_cancelled: false,
          paypal_subscription_id: resource.id,
        })
        .eq("id", userId);

      if (error) throw new Error(error.message);
      break;
    }

    case "PAYMENT.SALE.COMPLETED": {
      // Cobro exitoso de un ciclo recurrente. billing_agreement_id es
      // el nombre clasico del id de suscripcion en este tipo de evento
      // -- a confirmar contra un evento real de sandbox.
      const subscriptionId = resource.billing_agreement_id;
      if (!subscriptionId) break; // pago que no es de una suscripcion nuestra

      let { data: profile } = await adminClient
        .from("profiles")
        .select("id, plan, plan_billing_cycle, plan_expires_at")
        .eq("paypal_subscription_id", subscriptionId)
        .maybeSingle();

      // PayPal no garantiza el orden de entrega de sus webhooks -- si
      // este es el primer cobro de una suscripcion nueva, este evento
      // podria llegar antes que BILLING.SUBSCRIPTION.ACTIVATED (que es
      // quien recien pone paypal_subscription_id en el perfil). Un solo
      // reintento corto cubre ese caso sin convertir esto en una cola de
      // reintentos real.
      if (!profile) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        ({ data: profile } = await adminClient
          .from("profiles")
          .select("id, plan, plan_billing_cycle, plan_expires_at")
          .eq("paypal_subscription_id", subscriptionId)
          .maybeSingle());
      }

      if (!profile) throw new Error(`Suscripción no encontrada: ${subscriptionId}`);

      const base = profile.plan_expires_at && new Date(profile.plan_expires_at) > new Date()
        ? new Date(profile.plan_expires_at)
        : new Date();
      const expiresAt = addCycle(base, profile.plan_billing_cycle || "monthly");

      const { error } = await adminClient
        .from("profiles")
        .update({ plan_expires_at: expiresAt.toISOString(), plan_cancelled: false })
        .eq("id", profile.id);

      if (error) throw new Error(error.message);

      // Registro para la seccion de Ingresos del panel de admin -- este
      // evento es la unica fuente que trae el monto real cobrado, tanto
      // para el primer pago de la suscripcion como para cada renovacion.
      const { error: paymentError } = await adminClient.from("subscription_payments").insert({
        user_id: profile.id,
        paypal_subscription_id: subscriptionId,
        paypal_event_id: event.id,
        plan: profile.plan,
        billing_cycle: profile.plan_billing_cycle || "monthly",
        amount_usd: resource.amount?.total,
      });

      if (paymentError) throw new Error(paymentError.message);
      break;
    }

    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.SUSPENDED":
    case "BILLING.SUBSCRIPTION.EXPIRED": {
      // Se marca cancelado pero plan_expires_at no se toca -- el
      // usuario conserva su plan hasta la fecha ya pagada, mismo
      // comportamiento que Settings.jsx ya muestra hoy.
      const { error } = await adminClient
        .from("profiles")
        .update({ plan_cancelled: true })
        .eq("paypal_subscription_id", resource.id);

      if (error) throw new Error(error.message);
      break;
    }

    case "PAYMENT.CAPTURE.COMPLETED": {
      const purchaseIntentId = resource.custom_id;
      if (!purchaseIntentId) throw new Error("PAYMENT.CAPTURE.COMPLETED sin custom_id");

      const { data: intent } = await adminClient
        .from("purchase_intents")
        .select("*")
        .eq("id", purchaseIntentId)
        .maybeSingle();

      if (!intent) throw new Error(`purchase_intent no encontrado: ${purchaseIntentId}`);
      if (intent.status === "fulfilled") break; // ya se cumplio, no repetir

      if (intent.purchase_type === "special_touch") {
        const { data: result, error } = await adminClient.rpc("admin_fulfill_special_touch", {
          p_sender_id: intent.user_id,
          p_recipient_id: intent.metadata.recipient_id,
          p_message: intent.metadata.message,
        });

        if (error) throw new Error(error.message);

        const row = Array.isArray(result) ? result[0] : result;

        await adminClient
          .from("purchase_intents")
          .update({
            status: row?.sent ? "fulfilled" : "failed",
            failure_reason: row?.sent ? null : row?.reason,
            fulfilled_at: row?.sent ? new Date().toISOString() : null,
          })
          .eq("id", intent.id);
      } else if (intent.purchase_type === "boost") {
        const { data: activated, error } = await adminClient.rpc("admin_fulfill_boost", {
          p_user_id: intent.user_id,
        });

        if (error) throw new Error(error.message);

        await adminClient
          .from("purchase_intents")
          .update({
            status: activated ? "fulfilled" : "failed",
            failure_reason: activated ? null : "profile_not_found",
            fulfilled_at: activated ? new Date().toISOString() : null,
          })
          .eq("id", intent.id);
      } else if (intent.purchase_type === "verification_express") {
        const { data: created, error } = await adminClient.rpc("admin_fulfill_verification_express", {
          p_user_id: intent.user_id,
          p_photo_url: intent.metadata.photo_url,
          p_pose_requested: intent.metadata.pose_requested,
        });

        if (error) throw new Error(error.message);

        await adminClient
          .from("purchase_intents")
          .update({
            status: created ? "fulfilled" : "failed",
            failure_reason: created ? null : "already_pending",
            fulfilled_at: created ? new Date().toISOString() : null,
          })
          .eq("id", intent.id);
      }
      break;
    }

    default:
      // Evento que no nos interesa -- ya quedo guardado en
      // payment_events por si hace falta revisarlo despues.
      break;
  }
}
