-- Hace que "Modo invisible" (profiles.is_invisible) realmente oculte al
-- usuario de get_discoverable_profiles (usada tanto por Swipe como por
-- Buscar por afinidad -- comparten la misma funcion), con dos excepciones:
--
-- 1. Si ya le diste like a alguien, esa persona SI puede verte normalmente
--    (en su deck de Swipe/Explorar, y tambien en su lista de "A quien le
--    gustas", que ya funcionaba porque nada la bloqueaba).
-- 2. Si tu plan Premium/VIP ya vencio, el modo invisible deja de aplicar
--    -- mismo criterio de expiracion que isPlanActive() en src/lib/plan.js
--    (plan_expires_at is null o en el futuro). Sin esto, alguien que dejo
--    vencer su plan mientras tenia el toggle activado quedaria invisible
--    para siempre sin pagar. El toggle en Ajustes ya usa isPlanActive()
--    (Premium o VIP, no solo VIP) para decidir si mostrarlo, asi que la
--    misma regla debe aplicar aqui.
--
-- Antes de este cambio, is_invisible se guardaba en la tabla pero nunca
-- se leia en ningun lado -- el beneficio no tenia ningun efecto real.
--
-- Se usa coalesce(p.is_invisible, false) en vez de "not p.is_invisible"
-- a secas: si alguna fila tiene is_invisible en NULL (por ejemplo,
-- cuentas creadas antes de que existiera esta columna, sin default),
-- "not null" evalua a NULL y esa persona quedaria excluida del
-- descubrimiento por error, aunque nunca haya activado el modo invisible.
-- coalesce() lo trata como false (visible) en ese caso, que es el
-- comportamiento correcto por defecto.

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
      coalesce(p.is_invisible, false) = false
      or not (
        p.plan in ('premium', 'vip')
        and (p.plan_expires_at is null or p.plan_expires_at > now())
      )
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
