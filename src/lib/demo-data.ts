export const clients = [
  { name: "ABC Interiors", plan: "Growth", value: "AED 999", status: "Active", health: "Needs attention", progress: 84, access: "WhatsApp pending", renewal: "Oct 1", owner: "Maya" },
  { name: "Smile Dental", plan: "Scale", value: "AED 1,999", status: "Active", health: "Healthy", progress: 100, access: "All connected", renewal: "Oct 6", owner: "Maya" },
  { name: "XYZ Maintenance", plan: "Start", value: "AED 499", status: "Onboarding", health: "At risk", progress: 58, access: "Search Console missing", renewal: "Oct 12", owner: "Omar" },
];
export const deliverables = [
  { label: "Social posts", value: 98, total: 120, accent: "violet" }, { label: "SEO articles", value: 16, total: 20, accent: "blue" },
  { label: "SEO reviews", value: 8, total: 10, accent: "green" }, { label: "Reports", value: 3, total: 10, accent: "amber" },
];
export const access = [["Website", "Connected"], ["Google Analytics", "Connected"], ["Search Console", "Connected"], ["Instagram", "Connected"], ["Facebook", "Connected"], ["WhatsApp", "Pending"]] as const;
export const posts = [
  { id: 1, date: "05 Nov", time: "11:00 AM", platform: "Instagram + Facebook", topic: "From dated to designed", caption: "A kitchen should work as beautifully as it looks. This Dubai renovation pairs warm oak, hidden storage and a calm stone palette for a space made around everyday life.", status: "Ready to schedule", color: "coral" },
  { id: 2, date: "08 Nov", time: "6:30 PM", platform: "Instagram", topic: "Villa renovation checklist", caption: "Planning a villa renovation? Start with how you live—not just how you want the rooms to look. Save this checklist before your first design consultation.", status: "Ready to schedule", color: "sage" },
  { id: 3, date: "12 Nov", time: "12:00 PM", platform: "Instagram + Facebook", topic: "Storage that disappears", caption: "The best wardrobes create calm without calling attention to themselves. Floor-to-ceiling joinery makes every centimetre useful.", status: "Scheduled", color: "sand" },
];
export const tasks = [
  { title: "Review November social batch", client: "ABC Interiors", due: "Today", status: "Awaiting review", priority: "High" },
  { title: "Approve dental implant article", client: "Smile Dental", due: "Tomorrow", status: "Draft", priority: "Medium" },
  { title: "Confirm Search Console access", client: "XYZ Maintenance", due: "2 days", status: "Blocked", priority: "High" },
];
