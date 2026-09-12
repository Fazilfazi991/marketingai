export const QA_PROJECT_REF = "cwamjlqqacjfppnqquuw";
export const PRODUCTION_PROJECT_REF = "yzxhckeyktgxpflnrtne";

// Every hosted QA migration, seed and mutation runner must call this before I/O.
// Never echo the supplied value: a mistaken argument may contain credentials.
export function assertQaProject(targetRef) {
  if (targetRef === PRODUCTION_PROJECT_REF || targetRef !== QA_PROJECT_REF) {
    throw new Error("QA target rejected: only Growth1000 Preview is permitted.");
  }
  return QA_PROJECT_REF;
}

export function assertQaUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("QA URL rejected."); }
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      url.hostname !== `${QA_PROJECT_REF}.supabase.co` ||
      url.pathname !== "/" || url.search || url.hash) {
    throw new Error("QA URL rejected: only Growth1000 Preview is permitted.");
  }
  return assertQaProject(url.hostname.split(".")[0]);
}
