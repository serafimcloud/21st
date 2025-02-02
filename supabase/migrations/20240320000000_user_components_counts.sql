drop function if exists public.get_user_components_counts(uuid);
drop function if exists public.get_user_components_counts(text);

create or replace function public.get_user_components_counts(p_user_id text)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  if p_user_id is null or p_user_id = '' then
    return json_build_object(
      'published_count', 0,
      'demos_count', 0,
      'liked_count', 0
    );
  end if;

  select json_build_object(
    'published_count', coalesce((
      select count(distinct d.id)
      from demos d
      join components c on d.component_id = c.id
      where d.user_id = p_user_id
        and c.user_id = p_user_id
        and c.is_public = true
    ), 0),
    'demos_count', coalesce((
      select count(distinct d.id)
      from demos d
      join components c on d.component_id = c.id
      where d.user_id = p_user_id
        and c.user_id != p_user_id
        and c.is_public = true
    ), 0),
    'liked_count', coalesce((
      select count(distinct cl.component_id)
      from component_likes cl
      join components c on cl.component_id = c.id
      where cl.user_id = p_user_id
        and c.is_public = true
    ), 0)
  ) into result;

  return result;
end;
$$; 