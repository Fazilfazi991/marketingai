export default function Loading() {
  return (
    <div
      className="agent-workspace"
      aria-busy="true"
      aria-label="Loading your conversation"
    >
      <h1>Your Growth Agent</h1>
      <p>Loading your saved conversation…</p>
      <div className="agent-loading" />
    </div>
  );
}
