-- CSGT License Plate Scanner & Patrol Team System Database Migration
-- Target: PostgreSQL / Supabase Database
-- Created: 2026-06-30

-- --------------------------------------------------
-- 1. CLEAN EXISTING STRUCTURES
-- --------------------------------------------------
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS scans CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role_type CASCADE;

-- --------------------------------------------------
-- 2. CREATE DATABASE CUSTOM TYPES
-- --------------------------------------------------
CREATE TYPE user_role_type AS ENUM ('admin', 'chihuy', 'canbo');

-- --------------------------------------------------
-- 3. CREATE TABLES
-- --------------------------------------------------

-- --- Users Table ---
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    rank VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    unit VARCHAR(255) NOT NULL,
    avatar TEXT,
    role user_role_type NOT NULL DEFAULT 'canbo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --- Teams Table ---
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --- Team Members Join Table ---
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(team_id, user_id)
);

-- --- Scans Table ---
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_number VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    accuracy DOUBLE PRECISION NOT NULL, -- GPS accuracy meters
    speed DOUBLE PRECISION DEFAULT 0.0, -- km/h
    heading DOUBLE PRECISION DEFAULT 0.0, -- degrees direction
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --- Administrative System Logs Table ---
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------
-- 4. SEARCH OPTIMIZATION INDEXES
-- --------------------------------------------------
CREATE INDEX idx_scans_plate_number ON scans (plate_number);
CREATE INDEX idx_scans_timestamp ON scans (timestamp DESC);
CREATE INDEX idx_scans_user_id ON scans (user_id);
CREATE INDEX idx_teams_start_end ON teams (start_time, end_time);
CREATE INDEX idx_logs_created_at ON logs (created_at DESC);

-- --------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- --- USERS POLICIES ---
-- Admin and Commander can read all profiles; Patrol Officers can only read their own profile
CREATE POLICY "Users can read own profiles" ON users 
    FOR SELECT USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'chihuy'));

CREATE POLICY "Only Admin can write profiles" ON users 
    FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- --- TEAMS POLICIES ---
-- All logged-in personnel can read patrol teams
CREATE POLICY "Anyone can view patrol teams" ON teams 
    FOR SELECT USING (true);

-- Only Admin or Commander can establish/modify teams
CREATE POLICY "Admin or Commander can manage teams" ON teams 
    FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'chihuy'));

-- --- TEAM MEMBERS POLICIES ---
CREATE POLICY "Anyone can view team members" ON team_members 
    FOR SELECT USING (true);

CREATE POLICY "Admin or Commander can manage team members" ON team_members 
    FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'chihuy'));

-- --- SCANS POLICIES ---
-- Admin sees all scans. Commander sees all scans. Patrol Officer only sees their own scans
CREATE POLICY "View scans based on privilege" ON scans 
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'chihuy') 
        OR auth.uid() = user_id
    );

-- Any officer can insert scans
CREATE POLICY "Any officer can log scans" ON scans 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only Admin can delete or modify scan records
CREATE POLICY "Only Admin can delete scans" ON scans 
    FOR DELETE USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- --- LOGS POLICIES ---
-- Only Admin and Commander can read administrative logs
CREATE POLICY "Admin and Commander can view logs" ON logs 
    FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'chihuy'));

CREATE POLICY "Log insertion" ON logs 
    FOR INSERT WITH CHECK (true);

-- --------------------------------------------------
-- 6. SEEDING SEED DATA
-- --------------------------------------------------

-- Default Users Seeding (IDs matching mock profiles)
INSERT INTO users (id, username, fullname, rank, position, unit, avatar, role) VALUES
('11111111-1111-1111-1111-111111111111', 'admin', 'Phạm Minh Chính', 'Thượng tá', 'Trưởng phòng CSGT', 'Phòng CSGT Đường bộ - Đường sắt', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'admin'),
('22222222-2222-2222-2222-222222222222', 'chihuy', 'Lê Hồng Anh', 'Trung tá', 'Đội trưởng Đội CSGT', 'Đội CSGT Số 1', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'chihuy'),
('33333333-3333-3333-3333-333333333333', 'canbo1', 'Nguyễn Văn Hùng', 'Đại úy', 'Cán bộ Tuần tra', 'Đội CSGT Số 1', 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150', 'canbo'),
('44444444-4444-4444-4444-444444444444', 'canbo2', 'Trần Thế Anh', 'Thượng úy', 'Cán bộ Tuần tra', 'Đội CSGT Số 1', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'canbo');

-- Patrol Squads
INSERT INTO teams (id, team_name, start_time, end_time, created_by) VALUES
('55555555-5555-5555-5555-555555555555', 'Tổ Tuần tra Chuyên đề 141', NOW() - INTERVAL '12 HOURS', NOW() + INTERVAL '12 HOURS', '22222222-2222-2222-2222-222222222222'),
('66666666-6666-6666-6666-666666666666', 'Tổ Tuần tra Cơ động Số 1', NOW() - INTERVAL '48 HOURS', NOW() - INTERVAL '24 HOURS', '22222222-2222-2222-2222-222222222222');

-- Squad Members assignments
INSERT INTO team_members (team_id, user_id) VALUES
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333'),
('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444'),
('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333');

-- Default Scan Records
INSERT INTO scans (plate_number, timestamp, latitude, longitude, address, accuracy, speed, heading, confidence, user_id) VALUES
('29A-123.45', NOW() - INTERVAL '30 MINUTES', 21.028511, 105.804817, 'Cầu Giấy, Láng Thượng, Đống Đa, Hà Nội', 8.0, 34.0, 180.0, 96, '33333333-3333-3333-3333-333333333333'),
('30H-999.99', NOW() - INTERVAL '1 HOUR', 21.033333, 105.850000, 'Phố Hoàn Kiếm, Tràng Tiền, Hoàn Kiếm, Hà Nội', 5.0, 12.0, 90.0, 99, '33333333-3333-3333-3333-333333333333'),
('51F-567.89', NOW() - INTERVAL '2 HOURS', 21.006400, 105.842700, 'Đường Giải Phóng, Đồng Tâm, Hai Bà Trưng, Hà Nội', 10.0, 45.0, 270.0, 93, '44444444-4444-4444-4444-444444444444'),
('29D1-888.88', NOW() - INTERVAL '4 HOURS', 21.047800, 105.783600, 'Phạm Văn Đồng, Cổ Nhuế 1, Bắc Từ Liêm, Hà Nội', 12.0, 60.0, 0.0, 95, '44444444-4444-4444-4444-444444444444');

-- Administrative Audit logs
INSERT INTO logs (action, user_id) VALUES
('Khởi tạo cấu trúc cơ sở dữ liệu Supabase thành công', '11111111-1111-1111-1111-111111111111'),
('Thành lập tổ tuần tra mới: Tổ Tuần tra Chuyên đề 141', '22222222-2222-2222-2222-222222222222');
