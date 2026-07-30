// Wraps navigator.geolocation as a Promise. Never throws synchronously and
// never auto-prompts -- callers decide when to invoke this from an explicit
// user action (a button), since location access must stay opt-in.
export function requestLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Tu navegador no soporta compartir ubicación."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("No diste permiso de ubicación. Puedes seguir usando MyPinky con normalidad."));
        } else {
          reject(new Error("No se pudo obtener tu ubicación. Intenta de nuevo."));
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}
