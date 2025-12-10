-- =====================================================
-- NEWSLETTER ENGINE - SUPABASE DATABASE SCHEMA
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to create
-- the necessary tables for the Newsletter feature.
-- =====================================================

-- 1. Newsletter Posts Table
-- Stores curated newsletter entries with article summaries and commentary
CREATE TABLE IF NOT EXISTS newsletter_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    headline TEXT NOT NULL,
    summary TEXT NOT NULL,
    commentary TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_date TEXT,
    icon TEXT DEFAULT '📰',
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Newsletter Subscribers Table
-- Stores email subscribers for the newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE newsletter_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Newsletter Posts Policies
-- Allow public read access to published posts only
CREATE POLICY "Public can read published newsletter posts"
ON newsletter_posts FOR SELECT
USING (published = true);

-- Allow authenticated/anon users to insert/update/delete (for admin panel)
-- Note: In production, you'd want stricter auth, but this matches your blog setup
CREATE POLICY "Allow all operations on newsletter posts"
ON newsletter_posts FOR ALL
USING (true)
WITH CHECK (true);

-- Newsletter Subscribers Policies
-- Allow public to insert (subscribe)
CREATE POLICY "Public can subscribe to newsletter"
ON newsletter_subscribers FOR INSERT
WITH CHECK (true);

-- Allow public to read their own subscription (for unsubscribe verification)
CREATE POLICY "Public can read subscribers"
ON newsletter_subscribers FOR SELECT
USING (true);

-- Allow updates (for unsubscribe functionality and admin)
CREATE POLICY "Allow updates on subscribers"
ON newsletter_subscribers FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow deletes (for admin cleanup)
CREATE POLICY "Allow deletes on subscribers"
ON newsletter_subscribers FOR DELETE
USING (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for faster queries on published posts
CREATE INDEX IF NOT EXISTS idx_newsletter_posts_published 
ON newsletter_posts(published, created_at DESC);

-- Index for email lookups (already unique, but explicit index helps)
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email 
ON newsletter_subscribers(email);

-- Index for subscriber status filtering
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed 
ON newsletter_subscribers(subscribed);

-- =====================================================
-- SAMPLE DATA (OPTIONAL - Remove if not needed)
-- =====================================================

-- Uncomment below to insert a sample newsletter post:
/*
INSERT INTO newsletter_posts (headline, summary, commentary, source_url, source_date, published)
VALUES (
    'How CEOs Use Mental Models to Make Faster, Clearer Strategic Calls',
    'The CEO Project outlines how mental models help senior leaders filter noise and reach decisions without analysis paralysis. It frames models like Occam''s Razor, probabilistic thinking, and base-rate reasoning as "repeatable shortcuts" for structuring complex questions, from M&A to hiring. The article argues that CEOs don''t need more data—they need better ways to interpret it, especially when stakes are high and time is short. Case examples show how applying a small toolkit of models improves board communication and alignment across teams. For founders and operators, this is a blueprint for building a personal decision stack instead of winging every choice.',
    'This resonates deeply with my experience in product management. The best PMs I''ve worked with don''t just collect data—they have frameworks for interpreting it quickly. Mental models are essentially cognitive shortcuts that compound over time.',
    'https://theceoproject.com/mental-models-that-help-ceos-make-faster-decisions/',
    'May 26, 2025 (time not listed)',
    true
);
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify tables were created:
-- SELECT * FROM newsletter_posts LIMIT 5;
-- SELECT * FROM newsletter_subscribers LIMIT 5;
