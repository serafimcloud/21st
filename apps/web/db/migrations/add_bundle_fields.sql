-- Add bundle related fields to demos table
ALTER TABLE demos
ADD COLUMN has_bundle BOOLEAN DEFAULT FALSE,
ADD COLUMN bundle_js_url TEXT,
ADD COLUMN bundle_css_url TEXT,
ADD COLUMN bundle_html_url TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_demos_has_bundle ON demos(has_bundle);

-- Comment on columns
COMMENT ON COLUMN demos.has_bundle IS 'Indicates if this demo has a bundle generated';
COMMENT ON COLUMN demos.bundle_js_url IS 'URL to the bundled JavaScript file in R2';
COMMENT ON COLUMN demos.bundle_css_url IS 'URL to the bundled CSS file in R2';
COMMENT ON COLUMN demos.bundle_html_url IS 'URL to the bundled HTML file in R2'; 