export function initialGoogleSyncRange(now = new Date()) {
  return {from:new Date(now.getTime()-90*86400000).toISOString().slice(0,10),to:new Date(now.getTime()-86400000).toISOString().slice(0,10)};
}
export function googleSyncRange(from: unknown,to: unknown,now = new Date()) {
  const valid = (value:unknown): value is string => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
  if (!valid(from) || !valid(to) || from>to || to>=now.toISOString().slice(0,10) || Date.parse(to)-Date.parse(from)>89*86400000) throw new Error('Choose 1–90 completed days.');
  return {from,to};
}
