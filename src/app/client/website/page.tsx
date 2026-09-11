import { PendingLink } from "@/components/pending-link";
export default function Website() {
  return (
    <>
      <header className="dossier-heading">
        <h1>Website</h1>
        <p>Understand what is measured, and where a review is needed.</p>
      </header>
      <section className="dossier-panel">
        <h2>Website health</h2>
        <p>
          No measured website-health score is available. Connected analytics
          alone cannot establish whether your website is healthy.
        </p>
        <PendingLink href="/client/traffic?view=pages">
          Review measured pages
        </PendingLink>
      </section>
      <section className="dossier-panel">
        <h2>Enquiries and performance</h2>
        <p>
          Use your recorded results to discuss conversion opportunities with
          your team.
        </p>
        <PendingLink href="/client/leads">Review enquiries</PendingLink> ·{" "}
        <PendingLink href="/client/traffic">
          View available analytics
        </PendingLink>
      </section>
    </>
  );
}
