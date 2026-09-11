import { PendingLink } from "@/components/pending-link";
export default function Conversations() {
  return (
    <>
      <header className="dossier-heading">
        <h1>Conversations</h1>
        <p>Customer enquiries from your website and WhatsApp.</p>
      </header>
      <section className="dossier-panel">
        <h2>Start with your recorded enquiries</h2>
        <p>
          Enquiry records are available separately. Full conversation threads,
          unanswered-message status, and recurring-question analysis are not
          available in this workspace yet.
        </p>
        <PendingLink href="/client/leads">Review enquiries</PendingLink>
      </section>
    </>
  );
}
