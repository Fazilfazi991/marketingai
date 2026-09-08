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
  { id: 4, date: "15 Nov", time: "10:30 AM", platform: "Instagram", topic: "Material moodboard", caption: "Warm stone, brushed metal and natural timber: a timeless material story for a modern Dubai home.", status: "Published", color: "sage" },
  { id: 5, date: "18 Nov", time: "6:00 PM", platform: "Facebook", topic: "Before the renovation", caption: "Good renovation outcomes start long before demolition. Here are four decisions to make before work begins.", status: "Needs review", color: "coral" },
  { id: 6, date: "20 Nov", time: "11:30 AM", platform: "Instagram + Facebook", topic: "Wardrobe details", caption: "Quiet luxury lives in the details: considered lighting, smooth hardware and storage planned around your routine.", status: "Ready to schedule", color: "sand" },
  { id: 7, date: "22 Nov", time: "7:00 PM", platform: "Instagram", topic: "Open-plan balance", caption: "An open-plan home still needs distinct moments. Lighting, rugs and joinery can create zones without closing the space.", status: "Needs review", color: "sage" },
  { id: 8, date: "24 Nov", time: "1:00 PM", platform: "Instagram + Facebook", topic: "Site progress", caption: "From drawings to site: careful coordination keeps every trade moving toward the same design intent.", status: "Published", color: "coral" },
  { id: 9, date: "26 Nov", time: "6:30 PM", platform: "Instagram", topic: "Kitchen workflow", caption: "A beautiful kitchen becomes effortless when storage, preparation and cooking zones follow how you actually move.", status: "Scheduled", color: "sand" },
  { id: 10, date: "27 Nov", time: "12:00 PM", platform: "Facebook", topic: "Renovation questions", caption: "What should you ask an interior fit-out team before appointing them? Start with scope, communication and quality checks.", status: "Needs review", color: "sage" },
  { id: 11, date: "29 Nov", time: "11:00 AM", platform: "Instagram + Facebook", topic: "Dubai design", caption: "Designed for Dubai living: durable finishes, cool natural palettes and layouts that make hosting feel easy.", status: "Published", color: "coral" },
  { id: 12, date: "30 Nov", time: "7:30 PM", platform: "Instagram", topic: "November recap", caption: "A month of thoughtful details, site progress and spaces taking shape. Here is what November looked like at ABC Interiors.", status: "Published", color: "sand" },
];
export const tasks = [
  { title: "Review November social batch", client: "ABC Interiors", due: "Today", status: "Awaiting review", priority: "High" },
  { title: "Approve dental implant article", client: "Smile Dental", due: "Tomorrow", status: "Draft", priority: "Medium" },
  { title: "Confirm Search Console access", client: "XYZ Maintenance", due: "2 days", status: "Blocked", priority: "High" },
];
export const plans = [
  { name:"Start", price:499, clients:3, deliverables:["6 Social posts","1 SEO article","1 Website check","1 Monthly report"] },
  { name:"Growth", price:999, clients:5, featured:true, deliverables:["12 Social posts","2 SEO articles","1 SEO review","1 Website check","1 Monthly report"] },
  { name:"Scale", price:1999, clients:2, deliverables:["20 Social posts","4 SEO articles","2 SEO reviews","2 Website checks","1 Monthly report"] },
];
export const monthlyObligations = [
  {type:"Social posts",done:9,total:12},{type:"SEO articles",done:1,total:2},{type:"SEO review",done:1,total:1},{type:"Website check",done:1,total:1},{type:"Monthly report",done:0,total:1},
];
