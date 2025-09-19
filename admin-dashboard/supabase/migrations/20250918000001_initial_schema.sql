-- Initial schema for church management system
-- This migration creates the basic tables for the church admin dashboard

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'member',
    church_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Churches table
CREATE TABLE public.churches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website TEXT,
    pastor_name VARCHAR(255),
    established_date DATE,
    denomination VARCHAR(100),
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts table (for various community features)
CREATE TABLE public.community_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    post_type VARCHAR(50) NOT NULL, -- 'music_team_recruit', 'job_posting', 'church_news', etc.
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB, -- Store type-specific data
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Music team recruitments (specific table for better querying)
CREATE TABLE public.music_team_recruitments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    recruitment_type VARCHAR(100), -- 'worship_team', 'band', 'choir', etc.
    team_types JSONB, -- Array of team types needed
    worship_type VARCHAR(100), -- 'sunday_service', 'wednesday_service', etc.
    schedule TEXT,
    location VARCHAR(255),
    requirements TEXT,
    compensation VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'open',
    applications_count INTEGER DEFAULT 0,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job postings
CREATE TABLE public.job_postings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    job_type VARCHAR(100),
    employment_type VARCHAR(50), -- 'full_time', 'part_time', 'volunteer', etc.
    salary_range VARCHAR(100),
    location VARCHAR(255),
    requirements TEXT,
    benefits TEXT,
    contact_info JSONB,
    status VARCHAR(50) DEFAULT 'open',
    applications_count INTEGER DEFAULT 0,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Church news/events
CREATE TABLE public.church_news (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    category VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'normal',
    event_date TIMESTAMP WITH TIME ZONE,
    event_time VARCHAR(100),
    location VARCHAR(255),
    organizer VARCHAR(255),
    contact_info JSONB,
    tags TEXT[],
    image_urls TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sharing posts (free sharing, item requests, etc.)
CREATE TABLE public.sharing_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    sharing_type VARCHAR(50), -- 'offer', 'request'
    category VARCHAR(100),
    condition VARCHAR(50),
    price VARCHAR(100),
    location VARCHAR(255),
    contact_info JSONB,
    image_urls TEXT[],
    status VARCHAR(50) DEFAULT 'available',
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_community_posts_type ON public.community_posts(post_type);
CREATE INDEX idx_community_posts_church ON public.community_posts(church_id);
CREATE INDEX idx_community_posts_created ON public.community_posts(created_at DESC);

CREATE INDEX idx_music_recruitments_church ON public.music_team_recruitments(church_id);
CREATE INDEX idx_music_recruitments_status ON public.music_team_recruitments(status);
CREATE INDEX idx_music_recruitments_created ON public.music_team_recruitments(created_at DESC);

CREATE INDEX idx_job_postings_church ON public.job_postings(church_id);
CREATE INDEX idx_job_postings_status ON public.job_postings(status);
CREATE INDEX idx_job_postings_created ON public.job_postings(created_at DESC);

CREATE INDEX idx_church_news_church ON public.church_news(church_id);
CREATE INDEX idx_church_news_category ON public.church_news(category);
CREATE INDEX idx_church_news_created ON public.church_news(created_at DESC);

CREATE INDEX idx_sharing_posts_type ON public.sharing_posts(sharing_type);
CREATE INDEX idx_sharing_posts_church ON public.sharing_posts(church_id);
CREATE INDEX idx_sharing_posts_created ON public.sharing_posts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_team_recruitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharing_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - can be customized later)
-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Churches: Public read access
CREATE POLICY "Churches are viewable by everyone" ON public.churches
    FOR SELECT USING (true);

-- Community posts: Public read, authenticated users can create
CREATE POLICY "Community posts are viewable by everyone" ON public.community_posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create community posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Similar policies for other tables
CREATE POLICY "Music recruitments are viewable by everyone" ON public.music_team_recruitments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create music recruitments" ON public.music_team_recruitments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Job postings are viewable by everyone" ON public.job_postings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create job postings" ON public.job_postings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Church news are viewable by everyone" ON public.church_news
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create church news" ON public.church_news
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Sharing posts are viewable by everyone" ON public.sharing_posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create sharing posts" ON public.sharing_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert default church for development
INSERT INTO public.churches (id, name, description) VALUES
    ('9998-0000-0000-0000-000000000000', '협력사', 'Default church for partnership organizations');

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_churches
    BEFORE UPDATE ON public.churches
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_community_posts
    BEFORE UPDATE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_music_team_recruitments
    BEFORE UPDATE ON public.music_team_recruitments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_job_postings
    BEFORE UPDATE ON public.job_postings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_church_news
    BEFORE UPDATE ON public.church_news
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_sharing_posts
    BEFORE UPDATE ON public.sharing_posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();