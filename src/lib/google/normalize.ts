export function numeric(value:string|undefined){const parsed=Number(value);return Number.isFinite(parsed)?parsed:0}
