create or replace function public.get_liked_components(p_user_id text)
returns setof json
language plpgsql
security definer
as $$
begin
  return query
  select json_build_object(
    'id', d.id,
    'name', d.name,
    'demo_code', d.demo_code,
    'preview_url', d.preview_url,
    'video_url', d.video_url,
    'compiled_css', d.compiled_css,
    'demo_dependencies', d.demo_dependencies,
    'demo_direct_registry_dependencies', d.demo_direct_registry_dependencies,
    'pro_preview_image_url', d.pro_preview_image_url,
    'created_at', d.created_at,
    'updated_at', d.updated_at,
    'component_id', d.component_id,
    'component_data', json_build_object(
      'id', c.id,
      'name', c.name,
      'description', c.description,
      'component_slug', c.component_slug,
      'is_public', c.is_public,
      'user_id', c.user_id
    ),
    'user_data', json_build_object(
      'id', u.id,
      'name', u.name,
      'username', u.username,
      'display_name', u.display_name,
      'display_username', u.display_username,
      'image_url', u.image_url,
      'display_image_url', u.display_image_url
    ),
    'component_user_data', json_build_object(
      'id', cu.id,
      'name', cu.name,
      'username', cu.username,
      'display_name', cu.display_name,
      'display_username', cu.display_username,
      'image_url', cu.image_url,
      'display_image_url', cu.display_image_url
    ),
    'tags', coalesce(
      (
        select json_agg(
          json_build_object(
            'id', t.id,
            'name', t.name,
            'slug', t.slug
          )
        )
        from demo_tags dt
        join tags t on dt.tag_id = t.id
        where dt.demo_id = d.id
      ),
      '[]'::json
    ),
    'demo_slug', d.demo_slug
  )
  from demos d
  join components c on d.component_id = c.id
  join users u on d.user_id = u.id
  join users cu on c.user_id = cu.id
  join component_likes cl on cl.component_id = c.id
  where cl.user_id = p_user_id
    and c.is_public = true;
end;
$$;

create or replace function public.like_component_by_demo(
  p_user_id text,
  p_demo_id bigint,
  p_liked boolean
)
returns void
language plpgsql
security definer
as $$
declare
  v_component_id bigint;
begin
  -- Get component_id from demo
  select component_id into v_component_id
  from demos
  where id = p_demo_id;

  if v_component_id is null then
    raise exception 'Demo not found';
  end if;

  if p_liked then
    -- Unlike
    delete from component_likes
    where user_id = p_user_id and component_id = v_component_id;
  else
    -- Like
    insert into component_likes (user_id, component_id)
    values (p_user_id, v_component_id)
    on conflict (user_id, component_id) do nothing;
  end if;
end;
$$; 