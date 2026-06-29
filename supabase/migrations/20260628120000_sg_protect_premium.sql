-- Protege is_premium / trial_ends_at: solo service_role puede cambiarlos.
-- Evita que un usuario se auto-otorgue premium escribiendo su propia fila
-- (la RLS le da ALL sobre su fila, así que este trigger es el borde real).
--
-- Aplicar con:  supabase db push   (o pegar en el SQL Editor del dashboard)

create or replace function public.sg_protect_premium()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (auth.role() is distinct from 'service_role') and (
       new.is_premium is distinct from old.is_premium
    or new.trial_ends_at is distinct from old.trial_ends_at
  ) then
    raise exception 'is_premium/trial_ends_at solo pueden cambiarse via service_role';
  end if;
  return new;
end
$$;

drop trigger if exists sg_protect_premium_t on public.sg_profiles;
create trigger sg_protect_premium_t
  before update on public.sg_profiles
  for each row execute function public.sg_protect_premium();
