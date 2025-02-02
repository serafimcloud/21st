-- Обновляем функцию get_demos, убирая quick_filter
CREATE OR REPLACE FUNCTION public.get_demos(
  p_sort_by text,
  p_offset integer,
  p_limit integer,
  p_tag_slug text DEFAULT NULL,
  p_include_private boolean DEFAULT false
) RETURNS TABLE (
  id bigint,
  name text,
  demo_code text,
  preview_url text,
  video_url text,
  compiled_css text,
  demo_dependencies jsonb,
  demo_direct_registry_dependencies jsonb,
  pro_preview_image_url text,
  created_at timestamptz,
  updated_at timestamptz,
  component_id bigint,
  component_data jsonb,
  user_data jsonb,
  component_user_data jsonb,
  tags jsonb,
  total_count bigint,
  view_count bigint,
  fts tsvector,
  demo_slug text,
  debug_info jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total_count bigint;
BEGIN
  -- Calculate total count based on filter
  WITH filtered_demos AS (
    SELECT d.*
    FROM demos d
    JOIN components c ON d.component_id = c.id
    LEFT JOIN demo_tags dt ON d.id = dt.demo_id
    LEFT JOIN tags t ON dt.tag_id = t.id
    WHERE (c.is_public = true OR p_include_private = true)
    AND CASE 
      WHEN p_tag_slug IS NOT NULL THEN
        t.slug = p_tag_slug
      ELSE true
    END
  )
  SELECT COUNT(*) INTO v_total_count FROM filtered_demos;

  RETURN QUERY
  WITH analytics AS (
    SELECT 
      mca.component_id,
      SUM(CASE 
        WHEN mca.activity_type IN ('component_code_copy', 'component_prompt_copy', 'component_cli_download') 
        THEN mca.count 
        ELSE 0 
      END) as total_usage,
      SUM(CASE 
        WHEN mca.activity_type = 'component_view' 
        THEN mca.count 
        ELSE 0 
      END) as view_count
    FROM mv_component_analytics mca
    GROUP BY mca.component_id
  ),
  demos_count AS (
    SELECT 
      d.component_id,
      COUNT(*) as demo_count
    FROM demos d
    GROUP BY d.component_id
  ),
  filtered_demos AS (
    SELECT 
      d.*,
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'component_slug', c.component_slug,
        'downloads_count', COALESCE(a.total_usage, 0),
        'likes_count', c.likes_count,
        'license', c.license,
        'registry', c.registry,
        'code', c.code
      ) as component_data,
      row_to_json(du.*)::jsonb as user_data,
      row_to_json(cu.*)::jsonb as component_user_data,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'name', t.name,
            'slug', t.slug
          )
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'::jsonb
      ) as tags,
      COALESCE(a.view_count, 0)::bigint as view_count,
      COALESCE(dc.demo_count, 1) as demo_count
    FROM demos d
    JOIN components c ON d.component_id = c.id
    JOIN users du ON d.user_id = du.id
    JOIN users cu ON c.user_id = cu.id
    LEFT JOIN analytics a ON c.id = a.component_id
    LEFT JOIN demos_count dc ON d.component_id = dc.component_id
    LEFT JOIN demo_tags dt ON d.id = dt.demo_id
    LEFT JOIN tags t ON dt.tag_id = t.id
    WHERE (c.is_public = true OR p_include_private = true)
    AND CASE 
      WHEN p_tag_slug IS NOT NULL THEN
        t.slug = p_tag_slug
      ELSE true
    END
    GROUP BY d.id, c.id, du.id, cu.id, a.total_usage, a.view_count, dc.demo_count
  )
  SELECT 
    d.id,
    d.name,
    d.demo_code,
    d.preview_url,
    d.video_url,
    d.compiled_css,
    d.demo_dependencies,
    d.demo_direct_registry_dependencies,
    d.pro_preview_image_url,
    d.created_at,
    d.updated_at,
    d.component_id,
    d.component_data,
    d.user_data,
    d.component_user_data,
    d.tags,
    v_total_count as total_count,
    d.view_count,
    d.fts,
    d.demo_slug,
    jsonb_build_object(
      'params', jsonb_build_object(
        'sort_by', p_sort_by,
        'tag_slug', p_tag_slug
      ),
      'counts', jsonb_build_object(
        'total', v_total_count,
        'filtered', COUNT(*) OVER()
      ),
      'debug', jsonb_build_object(
        'downloads', COALESCE((d.component_data->>'downloads_count')::int, 0),
        'downloads_weight', COALESCE((d.component_data->>'downloads_count')::int, 0) * 0.4,
        'view_count', COALESCE(d.view_count, 0),
        'demo_count', NULLIF(d.demo_count, 0),
        'views_per_demo', COALESCE(d.view_count, 0)::float / NULLIF(d.demo_count, 0),
        'views_weight', (COALESCE(d.view_count, 0)::float / NULLIF(d.demo_count, 0)) * 0.3,
        'age_bonus', CASE 
          WHEN d.created_at > NOW() - INTERVAL '7 days' THEN 0.6
          WHEN d.created_at > NOW() - INTERVAL '14 days' THEN 0.4
          WHEN d.created_at > NOW() - INTERVAL '30 days' THEN 0.3
          WHEN d.created_at > NOW() - INTERVAL '90 days' THEN 0.15
          ELSE 0 
        END
      ),
      'recommendation_weight',
      (COALESCE((d.component_data->>'downloads_count')::int, 0) * 0.4 + 
       (COALESCE(d.view_count, 0)::float / NULLIF(d.demo_count, 0)) * 0.3) * 
      (1 + CASE 
        WHEN d.created_at > NOW() - INTERVAL '7 days' THEN 0.6
        WHEN d.created_at > NOW() - INTERVAL '14 days' THEN 0.4
        WHEN d.created_at > NOW() - INTERVAL '30 days' THEN 0.3
        WHEN d.created_at > NOW() - INTERVAL '90 days' THEN 0.15
        ELSE 0 
      END)
    ) as debug_info
  FROM filtered_demos d
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'downloads' THEN (d.component_data->>'downloads_count')::int
      WHEN p_sort_by = 'likes' THEN (d.component_data->>'likes_count')::int
      WHEN p_sort_by = 'date' THEN extract(epoch from d.created_at)
      WHEN p_sort_by = 'recommended' THEN 
        (COALESCE((d.component_data->>'downloads_count')::int, 0) * 0.4 + 
         (COALESCE(d.view_count, 0)::float / NULLIF(d.demo_count, 0)) * 0.3) * 
        (1 + CASE 
          WHEN d.created_at > NOW() - INTERVAL '7 days' THEN 0.6
          WHEN d.created_at > NOW() - INTERVAL '14 days' THEN 0.4
          WHEN d.created_at > NOW() - INTERVAL '30 days' THEN 0.3
          WHEN d.created_at > NOW() - INTERVAL '90 days' THEN 0.15
          ELSE 0 
        END)
    END DESC NULLS LAST
  OFFSET p_offset
  LIMIT p_limit;
END;
$$; 