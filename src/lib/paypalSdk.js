const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

// "capture" (compras unicas: Toque Especial, Boost) y "subscription"
// (Premium/VIP) necesitan cada una su propio script del SDK con
// opciones distintas -- se cargan bajo un data-namespace propio para
// poder convivir en la misma pagina sin pisarse, ya que en una SPA es
// posible visitar ambos tipos de checkout sin recargar la pagina.
const NAMESPACES = {
  capture: "paypalCapture",
  subscription: "paypalSubscription",
};

const sdkPromises = {};

export function loadPaypalSdk(intent = "capture") {
  const namespace = NAMESPACES[intent];

  if (window[namespace]) return Promise.resolve(window[namespace]);
  if (sdkPromises[intent]) return sdkPromises[intent];

  sdkPromises[intent] = new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      "client-id": PAYPAL_CLIENT_ID,
      currency: "USD",
      intent,
    });
    if (intent === "subscription") params.set("vault", "true");

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.dataset.namespace = namespace;
    script.onload = () => resolve(window[namespace]);
    script.onerror = () => {
      sdkPromises[intent] = null;
      reject(new Error("No se pudo cargar el SDK de PayPal."));
    };
    document.body.appendChild(script);
  });

  return sdkPromises[intent];
}
