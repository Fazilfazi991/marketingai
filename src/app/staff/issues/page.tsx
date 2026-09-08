import { AppShell } from "@/components/app-shell"; import { PostingQueue } from "@/components/posting-queue";
export default function Issues(){return <AppShell role="staff" title="Posting issues" subtitle="Items that need a partner decision."><PostingQueue initialTab="Issue"/></AppShell>}
