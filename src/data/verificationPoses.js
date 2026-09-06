// Gestos al azar para la selfie de verificacion -- el proposito es
// descartar fotos reciclados/robadas de internet, no una pose bonita.
// El texto real se traduce via i18n (verification.poses.<key>); esto
// solo define las keys y de donde elegir al azar.
export const VERIFICATION_POSES = [
  "peaceSignCheek",
  "handOpenBesideHead",
  "thumbsUp",
  "touchNoseIndex",
  "okSignByEye",
  "coveredOneEye",
  "twoFingersChin",
  "wavingHand",
];

export function pickRandomPose() {
  return VERIFICATION_POSES[Math.floor(Math.random() * VERIFICATION_POSES.length)];
}
