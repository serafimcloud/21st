-- Create a function to get top components for email digest
create or replace function public.get_top_components_for_email()
returns table (
  id text,
  name text,
  description text,
  username text,
  component_slug text,
  preview_url text,
  demo_slug text,
  demo_preview_url text,
  is_paid boolean,
  is_current_week boolean
) language sql security definer as $$
  WITH analytics AS (
    SELECT 
      mca.component_id,
      SUM(CASE 
        WHEN mca.activity_type = 'component_view' 
        THEN mca.count 
        ELSE 0 
      END) as view_count
    FROM mv_component_analytics mca
    GROUP BY mca.component_id
  ),
  components_list AS (
    SELECT DISTINCT
      c.id::text,
      c.name,
      c.description,
      u.username,
      c.component_slug,
      c.preview_url,
      d.demo_slug,
      d.preview_url as demo_preview_url,
      c.is_paid,
      COALESCE(a.view_count, 0) as view_count,
      d.created_at >= NOW() - INTERVAL '7 days' as is_current_week
    FROM public.components c
    JOIN public.users u ON c.user_id = u.id
    JOIN public.demos d ON d.component_id = c.id
    JOIN public.demo_bookmarks db ON db.demo_id = d.id
    LEFT JOIN analytics a ON a.component_id = c.id
    WHERE 
      d.created_at >= NOW() - INTERVAL '14 days'
      AND db.user_id IN ('user_2nA0HITg0H7hvozIDNdxvzinpei', 'user_2nElBLvklOKlAURm6W1PTu6yYFh')
      AND c.is_public = true
      AND db.bookmarked_at >= NOW() - INTERVAL '14 days'
  )
  SELECT 
    id,
    name,
    description,
    username,
    component_slug,
    preview_url,
    demo_slug,
    demo_preview_url,
    is_paid,
    is_current_week
  FROM components_list
  ORDER BY is_current_week DESC, view_count DESC
  LIMIT 10;
$$; 