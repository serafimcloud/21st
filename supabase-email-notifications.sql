-- This SQL file should be executed in the Supabase SQL Editor to update
-- the get_demos_submissions function to include email in the user_data response
-- This allows sending submission status email notifications

DROP FUNCTION IF EXISTS public.get_demos_submissions(text, integer, integer, text, boolean);

CREATE OR REPLACE FUNCTION public.get_demos_submissions(
  p_sort_by text,
  p_offset integer,
  p_limit integer,
  p_tag_slug text DEFAULT NULL,
  p_include_private boolean DEFAULT false
) RETURNS TABLE (
  id bigint,
  name text,
  preview_url text,
  video_url text,
  updated_at timestamptz,
  demo_slug text,
  component_data jsonb,
  user_data jsonb,
  component_user_data jsonb,
  total_count bigint,
  view_count bigint,
  bookmarks_count bigint,
  bundle_url jsonb,
  submission_status text,
  moderators_feedback text
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
      d.id,
      d.name,
      d.preview_url,
      d.video_url,
      d.updated_at,
      d.demo_slug,
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'component_slug', c.component_slug,
        'downloads_count', COALESCE(a.total_usage, 0),
        'likes_count', c.likes_count,
        'license', c.license,
        'registry', c.registry,
        'website_url', c.website_url
      ) as component_data,
      jsonb_build_object(
        'id', du.id,
        'username', du.username,
        'display_name', COALESCE(du.name, du.username),
        'display_username', du.username,
        'email', du.email
      ) as user_data,
      jsonb_build_object(
        'id', cu.id,
        'username', cu.username,
        'display_name', COALESCE(cu.name, cu.username),
        'display_username', cu.username
      ) as component_user_data,
      COALESCE(a.view_count, 0)::bigint as view_count,
      COALESCE(dc.demo_count, 1) as demo_count,
      d.created_at,
      COALESCE(d.bookmarks_count, 0)::bigint as bookmarks_count,
      CASE
        WHEN d.bundle_html_url IS NOT NULL THEN
          jsonb_build_object(
            'html', d.bundle_html_url
          )
        ELSE NULL
      END as bundle_url,
      s.status::text as submission_status,
      s.moderators_feedback
    FROM demos d
    JOIN components c ON d.component_id = c.id
    JOIN users du ON d.user_id = du.id
    JOIN users cu ON c.user_id = cu.id
    LEFT JOIN analytics a ON c.id = a.component_id
    LEFT JOIN demos_count dc ON d.component_id = dc.component_id
    LEFT JOIN demo_tags dt ON d.id = dt.demo_id
    LEFT JOIN tags t ON dt.tag_id = t.id
    LEFT JOIN submissions s ON c.id = s.component_id
    WHERE (c.is_public = true OR p_include_private = true)
    AND CASE 
      WHEN p_tag_slug IS NOT NULL THEN
        t.slug = p_tag_slug
      ELSE true
    END
    GROUP BY d.id, c.id, du.id, cu.id, a.total_usage, a.view_count, dc.demo_count, s.status, s.moderators_feedback
  )
  SELECT 
    d.id,
    d.name,
    d.preview_url,
    d.video_url,
    d.updated_at,
    d.demo_slug,
    d.component_data,
    d.user_data,
    d.component_user_data,
    v_total_count as total_count,
    d.view_count,
    d.bookmarks_count,
    d.bundle_url,
    d.submission_status,
    d.moderators_feedback
  FROM filtered_demos d
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'downloads' THEN (d.component_data->>'downloads_count')::int
      WHEN p_sort_by = 'likes' THEN (d.component_data->>'likes_count')::int
      WHEN p_sort_by = 'bookmarks' THEN d.bookmarks_count
      WHEN p_sort_by = 'date' THEN extract(epoch from d.created_at)
      WHEN p_sort_by = 'recommended' THEN 
        (COALESCE((d.component_data->>'downloads_count')::int, 0) * 0.4 + 
         (COALESCE(d.view_count, 0)::float / NULLIF(d.demo_count, 0)) * 0.3) * 
        -- New formula for calculating the bonus for freshness:
        -- 1. Calculate the number of days since creation
        -- 2. If the component is newer than 14 days, add a strong bonus, decreasing linearly
        -- 3. If older than 14 days - no bonus
        (1 + CASE 
          WHEN d.created_at > NOW() - INTERVAL '14 days' THEN 
            -- Linear decrease from 2.0 to 0 over 14 days
            3.0 * (1.0 - (EXTRACT(EPOCH FROM (NOW() - d.created_at)) / (14 * 24 * 60 * 60)))
          ELSE 0 
        END)
    END DESC NULLS LAST
  OFFSET p_offset
  LIMIT p_limit;
END;
$$; 