# Growth1000 Preview migration-adoption manifest

Scope: pre-Phase-2 canonical migrations. Target identity: cwamjlqqacjfppnqquuw.
Basis: current-state catalog/data equivalence. This manifest does not claim that any historical SQL file actually executed.

| Version | Migration | Classification | Evidence / exception |
|---|---|---|---|
| 202609080001 | growth1000_foundation | Schema materially represented; superseded final state represented | Foundation relations and baseline constraints exist; later migrations intentionally replace portions. |
| 20260908101856 | milestone_one_operations | Schema materially represented; data transformation accepted | Final application objects match; client-assets bucket configuration matches exactly. |
| 20260908102640 | milestone_two_social_operations | Superseded but final state represented | Social/content definitions survive in their later canonical forms. |
| 20260908103608 | milestone_three_client_portal | Superseded but final state represented | Client portal relations survive; later results-only policy changes are canonical. |
| 20260908104408 | milestone_four_blogs_seo | Superseded but final state represented | Blog/SEO base objects exist with Goal 3B extensions and corrected lifecycle constraints. |
| 20260908105724 | milestone_five_automation_foundation | Superseded but final state represented | Automation schema/function final forms match; current job rows are accepted separately from historical execution. |
| 20260908110557 | milestone_six_ai_social_generation | Superseded but final state represented | Generation schema exists in later versioned form. |
| 20260908111330 | milestone_seven_google_data | Schema materially represented; data transformation accepted | Google integration/metric schema matches; empty daily metric tables require no historical backfill. |
| 20260908112128 | role_security_hardening | Schema materially represented | Final function and policy attributes match. |
| 20260908113311 | storage_delete_policies | Schema materially represented | All six application-owned Storage policies match. |
| 20260908161500 | results_first_scope | Superseded but final state represented | Scope/results changes survive in later canonical definitions. |
| 20260908163942 | results_only_client_permissions | Superseded but final state represented | Preview matches this pre-Phase-2 policy state; Phase 2 intentionally replaces client_requests SELECT. |
| 20260908182319 | admin_audit_history | Schema materially represented | Audit table, trigger and related policy/ACL state match. |
| 20260908185430 | lead_ingestion_idempotency | Schema materially represented | Lead constraint/index/function-related final state matches. |
| 20260908190045 | transactional_social_completion | Superseded but final state represented | Final completion function body and attributes match later canonical version. |
| 20260908190657 | versioned_image_regeneration | Schema materially represented | Image generation/versioning final state matches. |
| 20260908194429 | generated_content_asset_policies | Schema materially represented | Final asset policy set matches. |
| 20260908211500 | restrict_internal_generation_metadata | Schema materially represented | Final results-only metadata restrictions match. |
| 20260908214207 | fix_polymorphic_audit_trigger | Schema materially represented | Corrected audit trigger function body and attributes match. |
| 20260909020000 | real_client_live_data | Schema materially represented; data transformation accepted from current state | Final schema matches. Current client_access values are accepted; execution of the historical updates is not provable and they must not be rerun. Analytics/Search Console tables are empty. |
| 20260909053448 | add_analytics_page_new_users | Schema materially represented | Column/default/nullability state matches. |
| 20260909065350 | goal_3a_social_workflow | Superseded but final state represented | Final lifecycle constraints, indexes and social completion behavior match. |
| 20260909104500 | grant_monthly_social_completion | Superseded but final state represented | Current function EXECUTE ACL is canonical. |
| 20260909141500 | repair_staff_poster_storage_policies | Schema materially represented | Current Storage policy definitions match. |
| 20260909144500 | allow_staff_social_production_transitions | Schema materially represented | Current transition trigger/function match. |
| 20260909152843 | goal_3b_seo_blog_factory | Exception resolved only by approved reconciliation | Schema represented; corrected migration and runtime recovered exactly. Two job rows are absent remotely and are supplied by 20260911230214. Runtime review confirms manual-only, no autonomous publication. Mark Goal 3B applied only after that reconciliation succeeds. |

## Post-manifest entries

- 20260911230214_preview_reconciliation: record only after its SQL actually succeeds.
- 20260911204412_growth_agent_conversations: not historical adoption; record only after its SQL actually succeeds.
