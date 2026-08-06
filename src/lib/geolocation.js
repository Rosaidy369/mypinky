// Wraps navigator.geolocation as a Promise. Never throws synchronously and
// never auto-prompts -- callers decide when to invoke this from an explicit
// user action (a button), since location access must stay opt-in.
//
// Rejects with an error whose `code` is one of "unsupported"/"denied"/
// "failed" rather than a hardcoded message -- this is a plain JS module, not
// a component, so it can't call useTranslation() itself; callers map the
// code to a translated message (see StepBasicInfo.jsx/MyProfile.jsx).
export function requestLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error("unsupported"), { code: "unsupported" }));
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
          reject(Object.assign(new Error("denied"), { code: "denied" }));
        } else {
          reject(Object.assign(new Error("failed"), { code: "failed" }));
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}
