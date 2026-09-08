import { Sparkles } from "lucide-react";
export function Brand({ compact = false }: { compact?: boolean }) { return <div className="brand"><span className="brand-mark"><Sparkles size={17}/></span>{!compact && <span>Growth<span>1000</span></span>}</div>; }
