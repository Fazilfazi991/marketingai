import {readFileSync,readdirSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";

const migrationsDir=join(process.cwd(),"supabase","migrations");
const migrations=readdirSync(migrationsDir).filter((name)=>name.endsWith(".sql")).sort();
const sql=migrations.map((name)=>readFileSync(join(migrationsDir,name),"utf8")).join("\n").toLowerCase();

describe("Supabase migration security",()=>{
  it("enables RLS for every public table declared by migrations",()=>{
    const tables=[...sql.matchAll(/create table (?:if not exists )?public\.([a-z0-9_]+)/g)].map((match)=>match[1]);
    const direct=new Set([...sql.matchAll(/alter table public\.([a-z0-9_]+) enable row level security/g)].map((match)=>match[1]));
    const dynamicBlocks=[...sql.matchAll(/foreach t in array array\[([^\]]+)\][\s\S]*?enable row level security/g)].flatMap((match)=>[...match[1].matchAll(/'([a-z0-9_]+)'/g)].map((item)=>item[1]));
    const protectedTables=new Set([...direct,...dynamicBlocks]);
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.filter((table)=>!protectedTables.has(table))).toEqual([]);
  });

  it("does not use known authorization anti-patterns",()=>{
    expect(sql).not.toMatch(/auth\.role\s*\(/);
    expect(sql).not.toMatch(/raw_user_meta_data/);
    expect(sql).not.toMatch(/to authenticated\s+using\s*\(\s*true\s*\)/);
    expect(sql).not.toMatch(/to authenticated\s+with check\s*\(\s*true\s*\)/);
    expect(sql).not.toMatch(/grant\s+[^;]+\s+to\s+anon\b/);
  });

  it("keeps the client surface results-only",()=>{
    const correction=readFileSync(join(migrationsDir,"20260908163942_results_only_client_permissions.sql"),"utf8").toLowerCase();
    for(const policy of ["client creates own requests","clients submit content decisions","clients transition approved content","clients update own business profile","clients add asset metadata","clients upload own files","clients replace own files","clients delete own files"]){
      expect(correction).toContain(`drop policy if exists \"${policy}\"`);
    }
    expect(correction).toContain("status = 'published'");
    expect(correction).toContain("create function public.client_keyword_results()");
    expect(sql).toContain('create policy "authorized users read client leads"');
    expect(sql).toContain("private.can_access_client(client_id)");
  });

  it("restricts privileged workflow functions to their intended roles",()=>{
    expect(sql).toContain("revoke all on function public.complete_monthly_social_run(uuid,jsonb,text,text,numeric) from public,anon,authenticated");
    expect(sql).toContain("grant execute on function public.complete_monthly_social_run(uuid,jsonb,text,text,numeric) to service_role");
    expect(sql).toContain("revoke all on function public.client_keyword_results() from public, anon");
    expect(sql).toContain("grant execute on function public.client_keyword_results() to authenticated");
  });
  it("protects real-client integration tables and scoped result health",()=>{expect(sql).toContain("alter table public.analytics_page_daily enable row level security");expect(sql).toContain("alter table public.client_sites enable row level security");expect(sql).toContain("revoke all on public.client_sites from anon");expect(sql).toContain("security definer set search_path=''");expect(sql).toContain("where m.client_id=i.client_id and m.user_id=(select auth.uid())");expect(sql).toContain("revoke all on function public.client_result_health() from public,anon")});
  it("keeps staff poster storage tenant-scoped and production transitions forward-only",()=>{
    const storageRepair=readFileSync(join(migrationsDir,"20260909141500_repair_staff_poster_storage_policies.sql"),"utf8").toLowerCase();
    const transitionRepair=readFileSync(join(migrationsDir,"20260909144500_allow_staff_social_production_transitions.sql"),"utf8").toLowerCase();
    expect(storageRepair).toContain("storage.foldername(storage.objects.name)");
    expect(storageRepair).toContain("private.is_org_staff(c.organization_id)");
    expect(transitionRepair).toContain("old.status = 'ready_for_design' and new.status in ('poster_created', 'issue')");
    expect(transitionRepair).toContain("old.status = 'poster_created' and new.status in ('ready_to_schedule', 'issue')");
    expect(transitionRepair).toContain("old.status = 'scheduled' and new.status in ('published', 'issue')");
    expect(transitionRepair).toContain("revoke all on function private.enforce_social_transition() from public, anon, authenticated");
  });
  it("keeps Goal 3B inventory and review data admin-only and tenant-scoped",()=>{
    const goal3b=readFileSync(join(migrationsDir,"20260909152843_goal_3b_seo_blog_factory.sql"),"utf8").toLowerCase();
    expect(goal3b).toContain("alter table public.website_inventory_runs enable row level security");
    expect(goal3b).toContain("alter table public.seo_reviews enable row level security");
    expect(goal3b).toContain("private.is_org_admin(c.organization_id)");
    expect(goal3b).toContain("revoke all on public.website_inventory_runs,public.seo_reviews from anon");
    expect(goal3b).not.toContain("create policy \"clients");
    expect(goal3b).toContain("ready_for_codex");
  });
});
