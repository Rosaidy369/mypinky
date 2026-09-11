-- El panel de admin (mypinky-admin) solo podia suspender de forma
-- indefinida (suspended_until = now() + 100 years, hardcodeado) sin
-- ninguna forma de elegir cuanto debia durar la suspension. Se agrega
-- un parametro opcional p_until: si se pasa, se usa esa fecha; si no,
-- se mantiene el fallback indefinido de siempre (compatibilidad hacia
-- atras con cualquier otro llamador que no lo use).
create or replace function public.admin_set_user_suspension(
  p_user_id uuid,
  p_suspend boolean,
  p_reason text default null,
  p_until timestamptz default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin) then
    raise exception 'No autorizado';
  end if;

  if p_suspend and p_until is not null and p_until <= now() then
    raise exception 'La fecha de vencimiento de la suspension debe ser en el futuro';
  end if;

  update profiles
  set suspended_until = case when p_suspend then coalesce(p_until, now() + interval '100 years') else null end,
      suspension_reason = case when p_suspend then coalesce(p_reason, 'Suspendido por un administrador') else null end
  where id = p_user_id;
end;
$function$;
