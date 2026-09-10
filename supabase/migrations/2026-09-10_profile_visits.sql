-- "Quien vio tu perfil" + extension de Modo invisible para que tambien
-- cubra las visitas a perfil completo, no solo el descubrimiento
-- (Swipe/Buscar por afinidad, ya arreglado en
-- 2026-09-10_invisible_mode_fix.sql).

-- 1. Tabla de visitas -- una fila por par (visitante, visitado), la
--    visita mas reciente actualiza last_visited_at en vez de acumular
--    un log infinito.
create table public.profile_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references public.profiles(id) on delete cascade,
  visited_profile_id uuid not null references public.profiles(id) on delete cascade,
  last_visited_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (visitor_id, visited_profile_id),
  check (visitor_id != visited_profile_id)
);

alter table public.profile_visits enable row level security;

-- Solo el visitado puede leer sus propias visitas. A proposito NO hay
-- ninguna politica de insert/update/delete para anon/authenticated --
-- la unica forma de escribir es la funcion security definer de abajo,
-- que fija visitor_id desde auth.uid() y nunca confia en un parametro
-- que el cliente pueda falsificar. Un insert directo del cliente a esta
-- tabla queda bloqueado por RLS sin excepcion.
create policy "Solo el visitado puede ver sus propias visitas"
  on public.profile_visits for select
  using (visited_profile_id = auth.uid());

-- 2. Helper reutilizable -- la regla "invisible Y con plan activo" ya
--    vivia duplicada inline en get_discoverable_profiles (fix de hoy
--    mismo); se extrae para no repetirla una tercera vez aqui.
create or replace function public.is_currently_invisible(p_profile_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(is_invisible, false)
    and plan in ('premium','vip')
    and (plan_expires_at is null or plan_expires_at > now())
  from profiles
  where id = p_profile_id;
$$;

-- 3. get_discoverable_profiles -- mismo comportamiento que el fix de
--    hoy, solo que ahora usa el helper en vez de repetir la condicion
--    de plan inline.
create or replace function public.get_discoverable_profiles(
  p_gender text default null::text,
  p_min_age integer default null::integer,
  p_max_age integer default null::integer,
  p_max_distance_km double precision default null::double precision,
  p_exclude_swiped boolean default true,
  p_limit integer default 30,
  p_online_only boolean default false,
  p_dating_intent text default null::text,
  p_interests text[] default null::text[]
)
returns table(
  id uuid, name text, age integer, gender text, city text, bio text,
  photos text[], interests text[], mood text, prompts jsonb,
  voice_note_url text, plan text, plan_expires_at timestamp with time zone,
  distance_km double precision, is_online boolean, is_boosted boolean,
  is_verified boolean, dating_intent text
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  caller_id uuid := auth.uid();
  caller_lat double precision;
  caller_lon double precision;
begin
  select p.latitude, p.longitude into caller_lat, caller_lon
  from profiles p where p.id = caller_id;

  return query
  select
    p.id, p.name, calculate_age(p.birth_date) as age, p.gender, p.city, p.bio, p.photos, p.interests,
    p.mood, p.prompts, p.voice_note_url, p.plan, p.plan_expires_at,
    case
      when caller_lat is null or caller_lon is null or p.latitude is null or p.longitude is null
        then null
      else calculate_distance_km(caller_lat, caller_lon, p.latitude, p.longitude)
    end as distance_km,
    (p.last_seen_at is not null and p.last_seen_at > now() - interval '2 minutes') as is_online,
    (p.boosted_until is not null and p.boosted_until > now()) as is_boosted,
    p.is_verified,
    p.dating_intent
  from profiles p
  where p.id != caller_id
    and p.bio is not null
    and p.deleted_at is null
    and (
      not public.is_currently_invisible(p.id)
      or exists (
        select 1 from swipes s
        where s.swiper_id = p.id and s.swiped_profile_id = caller_id
      )
    )
    and (p_gender is null or p.gender = p_gender)
    and (p_min_age is null or calculate_age(p.birth_date) >= p_min_age)
    and (p_max_age is null or calculate_age(p.birth_date) <= p_max_age)
    and (p_dating_intent is null or p.dating_intent = p_dating_intent)
    and (p_interests is null or p.interests && p_interests)
    and (
      p_exclude_swiped = false
      or not exists (select 1 from swipes s where s.swiper_id = caller_id and s.swiped_profile_id = p.id)
    )
    and (
      p_max_distance_km is null
      or caller_lat is null or caller_lon is null or p.latitude is null or p.longitude is null
      or calculate_distance_km(caller_lat, caller_lon, p.latitude, p.longitude) <= p_max_distance_km
    )
    and (
      p_online_only = false
      or (p.last_seen_at is not null and p.last_seen_at > now() - interval '2 minutes')
    )
  order by (p.boosted_until is not null and p.boosted_until > now()) desc, p.id
  limit p_limit;
end;
$function$;

-- 4. Registrar una visita -- SECURITY DEFINER, ignora RLS para el
--    insert, pero fija visitor_id = auth.uid() (nunca desde un
--    parametro del cliente). Si el visitante esta invisible con plan
--    activo, no se registra nada -- el visitado nunca se entera.
create or replace function public.record_profile_visit(p_visited_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null or caller_id = p_visited_profile_id then
    return;
  end if;

  if public.is_currently_invisible(caller_id) then
    return;
  end if;

  insert into profile_visits (visitor_id, visited_profile_id, last_visited_at)
  values (caller_id, p_visited_profile_id, now())
  on conflict (visitor_id, visited_profile_id)
  do update set last_visited_at = excluded.last_visited_at;
end;
$$;

grant execute on function public.record_profile_visit(uuid) to authenticated;

-- 5. Notificacion de "visitas nuevas sin ver" -- mismo patron que
--    likes_seen_count.
alter table public.notification_views
  add column visitors_seen_count integer not null default 0;
