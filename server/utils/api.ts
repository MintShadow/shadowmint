// example in src/utils/api.ts
export async function getProfile() {
  const res = await fetch("/api/profile");
  return res.json();
}
