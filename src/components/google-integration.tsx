'use client';
import { useState } from 'react';
import styles from './google-integration.module.css';

type Connection = {id:string;account_email:string;status:string};
type Integration = {provider:string;status:string;external_reference:string|null;last_synced_at:string|null;last_sync_status:string|null;google_connection_id:string|null;auth_method:string};
type Properties = {ga4:{id:string;name:string;account:string}[];gsc:{id:string;permission:string}[]};
type Dashboard = {connections:Connection[];integrations:Integration[]};
const status = (value:string) => ({connected:'Connected',needs_reconnection:'Needs reconnection',access_removed:'Access removed',sync_error:'Sync error',not_connected:'Not connected',revoking:'Revocation pending'}[value] ?? value);
export function GoogleIntegration({clientId,clientName,ready,selectedConnection = '',initial,initialRange}: {clientId:string;clientName:string;ready:boolean;selectedConnection?:string;initial:Dashboard;initialRange:{from:string;to:string}}) {
  const [data,setData] = useState(initial), [connection,setConnection] = useState(selectedConnection);
  const [properties,setProperties] = useState<Properties|null>(null),[ga4,setGa4] = useState(''),[gsc,setGsc] = useState('');
  const [busy,setBusy] = useState(false),[message,setMessage] = useState('');
  const [gaFrom,setGaFrom] = useState(initialRange.from),[gaTo,setGaTo] = useState(initialRange.to);
  const [gscFrom,setGscFrom] = useState(initialRange.from),[gscTo,setGscTo] = useState(initialRange.to);
  const refresh = async () => {
    const response = await fetch(`/api/integrations/google?client_id=${encodeURIComponent(clientId)}`,{cache:'no-store'});
    const result = await response.json(); if (!response.ok) throw new Error(result.error); setData(result);
  };
  const act = async (action:string, extra:Record<string,unknown>={}) => {
    setBusy(true);setMessage('');
    try {
      const response = await fetch('/api/integrations/google',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,client_id:clientId,...extra})});
      const result = await response.json();if (!response.ok) throw new Error(result.error);
      if (result.url) {window.location.assign(result.url);return;}
      await refresh();setProperties(null);
      if (action==='sync' && Array.isArray(result.sync)) {
        const detail=result.sync.map((item:{source:string;rows:number;fetchDurationMs:number;databaseDurationMs:number})=>`${item.source}: ${item.rows} rows, fetch ${item.fetchDurationMs} ms, database ${item.databaseDurationMs} ms`).join(' · ');
        setMessage(`Sync finished. Missing observations remain unavailable. ${detail}`);
      } else setMessage(action==='sync'?'Sync finished. Missing observations remain unavailable.':'Changes saved. No automatic import was started.');
    } catch(e) { setMessage(e instanceof Error?e.message:'The operation could not be completed.'); }
    finally {setBusy(false);}
  };
  const load = async () => {
    setBusy(true);setMessage('');setProperties(null);setGa4('');setGsc('');
    try {
      const response = await fetch(`/api/integrations/google?client_id=${encodeURIComponent(clientId)}&connection_id=${encodeURIComponent(connection)}`,{cache:'no-store'});
      const result = await response.json();if (!response.ok) throw new Error(result.error);setProperties(result);
    } catch(e) { setMessage(e instanceof Error?e.message:'Properties could not be loaded.'); }
    finally {setBusy(false);}
  };
  const detect = async () => {
    setBusy(true);setMessage('');
    try {
      const response=await fetch(`/api/integrations/google?client_id=${encodeURIComponent(clientId)}&freshness=1`,{cache:'no-store'});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setGaFrom(result.google_analytics.from);setGaTo(result.google_analytics.to);setGscFrom(result.search_console.from);setGscTo(result.search_console.to);
      setMessage(`Prepared two completed 28-day periods per source. Analytics through ${result.google_analytics.to}; Search Console through ${result.search_console.to}. No import has run yet.`);
    } catch(e) {setMessage(e instanceof Error?e.message:'Completed source dates could not be detected.');}
    finally {setBusy(false);}
  };
  const boundIds = [...new Set(data.integrations.filter(i=>i.google_connection_id && i.status!=='not_connected').map(i=>i.google_connection_id!))];
  return <section className={styles.root} aria-labelledby="google-heading">
    <header><div><h2 id="google-heading">Google Analytics &amp; Search Console</h2><p>Connect an account that already has access to {clientName}’s properties. Only your selected properties belong to this client.</p></div><span className={styles.badge}>Read-only Google access</span></header>
    {!ready && <p className={styles.notice}>Managed Google connection is awaiting an approved migration and server configuration. Existing property references are preserved. No Google consent or import can run yet.</p>}
    {message && <p className={styles.notice} role="status">{message}</p>}
    <div className={styles.sources}>
      {['google_analytics','search_console'].map(provider=>{const item=data.integrations.find(i=>i.provider===provider), account=data.connections.find(c=>c.id===item?.google_connection_id);return <div key={provider}>
        <h3>{provider==='google_analytics'?'Analytics':'Search Console'}</h3>
        <strong>{item?.external_reference || 'No property selected'}</strong>
        <span>{item?.auth_method==='service_account'?'Legacy service-account reference — access not verified here':status(account?.status && account.status!=='connected'?account.status:item?.status ?? 'not_connected')}</span>
        {account && <span>Connected as {account.account_email}</span>}
        <small>Last sync: {item?.last_synced_at ? `${new Date(item.last_synced_at).toISOString().slice(0,16).replace('T',' ')} UTC`:'Never'}</small>
      </div>;})}
    </div>
    <div className={styles.actions}>
      <button className="button" disabled={!ready||busy} onClick={()=>act('connect')}>Connect {data.connections.length?'another Google account':'Google'}</button>
    </div>
    {data.connections.length>0 && <div className={styles.selection}>
      <h3>Select Google properties for {clientName}</h3>
      <label>Existing Google connection<select value={connection} disabled={busy} onChange={e=>{setConnection(e.target.value);setProperties(null);setGa4('');setGsc('');}}><option value="">Choose an account</option>{data.connections.map(c=><option key={c.id} value={c.id}>{c.account_email} — {status(c.status)}</option>)}</select></label>
      <div className={styles.actions}>
        <button className="button secondary" disabled={!ready||busy||!connection} onClick={load}>Load accessible properties</button>
        <button className="button secondary" disabled={!ready||busy||!connection} onClick={()=>act('connect',{connection_id:connection})}>Reconnect Google</button>
      </div>
      {properties && <><div className={styles.sources}>
        <label>Analytics property<select value={ga4} onChange={e=>setGa4(e.target.value)} disabled={busy}><option value="">No Analytics property</option>{properties.ga4.map(p=><option key={p.id} value={p.id}>{p.name} — {p.id} ({p.account})</option>)}</select></label>
        <label>Search Console property<select value={gsc} onChange={e=>setGsc(e.target.value)} disabled={busy}><option value="">No Search Console property</option>{properties.gsc.map(p=><option key={p.id} value={p.id}>{p.id} ({p.permission})</option>)}</select></label>
      </div><p>Confirm the exact website and business before saving. A matching name alone is not proof. Leaving a source unselected disconnects that source for this client.</p>
      <button className="button" disabled={busy||(!ga4&&!gsc)} onClick={()=>act('bind',{connection_id:connection,ga4,gsc})}>Confirm connection</button></>}
    </div>}
    <div className={styles.selection}><h3>Manual sync</h3><p>Choose up to 90 completed days per source. Sync reads this client’s saved properties only; provider coverage may be incomplete.</p>
      <div className={styles.sources}><label>Analytics from<input aria-label="Analytics from" type="date" value={gaFrom} onChange={e=>setGaFrom(e.target.value)} /></label><label>Analytics through<input aria-label="Analytics through" type="date" value={gaTo} onChange={e=>setGaTo(e.target.value)} /></label></div>
      <div className={styles.sources}><label>Search Console from<input aria-label="Search Console from" type="date" value={gscFrom} onChange={e=>setGscFrom(e.target.value)} /></label><label>Search Console through<input aria-label="Search Console through" type="date" value={gscTo} onChange={e=>setGscTo(e.target.value)} /></label></div>
      <div className={styles.actions}><button className="button secondary" disabled={!ready||busy||!data.integrations.some(i=>['connected','sync_error'].includes(i.status)&&i.auth_method==='google_oauth')} onClick={detect}>Use latest completed 56 days</button><button className="button" disabled={!ready||busy||!data.integrations.some(i=>['connected','sync_error'].includes(i.status)&&i.auth_method==='google_oauth')} onClick={()=>act('sync',{ranges:{google_analytics:{from:gaFrom,to:gaTo},search_console:{from:gscFrom,to:gscTo}}})}>{busy?'Working…':'Sync now'}</button>
      {boundIds.map(id=><button key={id} className="button secondary" disabled={busy||!ready} onClick={()=>{if(window.confirm('Disconnect this client’s properties? Other clients will keep their connection.'))void act('disconnect',{connection_id:id});}}>Disconnect client properties</button>)}</div>
    </div>
    {connection && <details className={styles.selection}><summary>Shared account controls</summary><p>Revoking a Google account is different from disconnecting this client. Every dependent client must be disconnected first.</p><button className="button secondary" disabled={!ready||busy} onClick={()=>{if(window.confirm('Revoke this shared Google grant? This is allowed only when no active client mappings remain.'))void act('revoke',{connection_id:connection});}}>Revoke shared Google connection</button></details>}
  </section>;
}
