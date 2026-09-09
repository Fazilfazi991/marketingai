-- The direct admin generation path uses the signed-in admin session. The
-- function remains SECURITY INVOKER, so table RLS continues to authorize every
-- read and write performed by the transaction.
grant execute on function public.complete_monthly_social_run(uuid,jsonb,text,text,numeric) to authenticated;
