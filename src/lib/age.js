export function calculateAge(birthDateString) {
  if (!birthDateString) return null;

  const birthDate = new Date(birthDateString);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) age -= 1;

  return age;
}

export function isAtLeast18(birthDateString) {
  const age = calculateAge(birthDateString);
  return age !== null && age >= 18;
}
