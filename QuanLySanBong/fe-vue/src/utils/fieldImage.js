const PLACEHOLDER = `${import.meta.env?.BASE_URL ?? "/"}assets/court-placeholder.svg`;

export function fieldImageUrl(reference) {
  if (typeof reference !== "string" || !reference.trim()) return PLACEHOLDER;
  const base = (import.meta.env?.VITE_MINIO_PUBLIC_URL || "http://103.167.88.223:9000/nhom2").replace(/\/+$/, "");
  let key = reference.trim();
  if (/^https?:\/\//i.test(key)) {
    try { const url = new URL(key); const endpoint = new URL(base); if (url.origin !== endpoint.origin || !url.pathname.startsWith(endpoint.pathname + "/")) return PLACEHOLDER; key = url.pathname.slice(endpoint.pathname.length + 1); }
    catch { return PLACEHOLDER; }
  }
  key = key.replace(/^\/+/, "");
  const bucket = base.split("/").pop();
  if (key.startsWith(bucket + "/")) key = key.slice(bucket.length + 1);
  if (!key || key.includes("..") || key.includes("\\") || key.includes(":")) return PLACEHOLDER;
  try { return `${base}/${key.split("/").map(segment => encodeURIComponent(decodeURIComponent(segment))).join("/")}`; }
  catch { return PLACEHOLDER; }
}
