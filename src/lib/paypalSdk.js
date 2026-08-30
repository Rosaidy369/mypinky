const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

let sdkPromise = null;

// Carga el SDK de PayPal una sola vez por sesion de pagina, sin importar
// cuantos componentes distintos lo pidan (Toque Especial, Boost,
// Checkout de suscripciones) -- reinyectar el script varias veces
// duplica los botones renderizados.
export function loadPaypalSdk(intent = "capture") {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=${intent}${intent === "subscription" ? "&vault=true" : ""}`;
    script.onload = () => resolve(window.paypal);
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("No se pudo cargar el SDK de PayPal."));
    };
    document.body.appendChild(script);
  });

  return sdkPromise;
}
