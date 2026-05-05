-- ============================================================
-- OTMS - Online Tuition Management System
-- Supabase PostgreSQL Schema
-- HOW TO USE:
--   1. Go to your Supabase project → SQL Editor → New Query
--   2. Paste this entire file and click Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP TABLES (clean slate — safe to re-run)
-- ============================================================
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS tutors CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL CHECK (role IN ('student', 'tutor', 'admin')),
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- 2. STUDENTS TABLE
-- ============================================================
CREATE TABLE students (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(20),
  bio         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TUTORS TABLE
-- ============================================================
CREATE TABLE tutors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(20),
  subject     VARCHAR(255),
  bio         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. COURSES TABLE
-- ============================================================
CREATE TABLE courses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id    UUID REFERENCES tutors(id) ON DELETE SET NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  subject     VARCHAR(255) NOT NULL,
  schedule    VARCHAR(255),
  fee         DECIMAL(10,2) DEFAULT 0,
  meet_link   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. ENROLLMENTS TABLE
-- ============================================================
CREATE TABLE enrollments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id   UUID REFERENCES courses(id)  ON DELETE CASCADE,
  status      VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- ============================================================
-- 6. ATTENDANCE TABLE
-- ============================================================
CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID REFERENCES courses(id)  ON DELETE CASCADE,
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  status      VARCHAR(20) DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, student_id, date)
);

-- ============================================================
-- 7. ASSIGNMENTS TABLE
-- ============================================================
CREATE TABLE assignments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID REFERENCES courses(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  due_date    DATE NOT NULL,
  max_marks   INTEGER DEFAULT 100,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. SUBMISSIONS TABLE
-- ============================================================
CREATE TABLE submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id   UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id      UUID REFERENCES students(id)    ON DELETE CASCADE,
  content         TEXT,
  file_url        TEXT,
  status          VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
  marks_obtained  INTEGER,
  feedback        TEXT,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- ============================================================
-- 9. PAYMENTS TABLE
-- ============================================================
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id       UUID REFERENCES courses(id)  ON DELETE SET NULL,
  amount          DECIMAL(10,2) NOT NULL,
  payment_method  VARCHAR(50)   DEFAULT 'card',
  transaction_id  VARCHAR(100)  UNIQUE,
  status          VARCHAR(20)   DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_users_email          ON users(email);
CREATE INDEX idx_students_user_id     ON students(user_id);
CREATE INDEX idx_tutors_user_id       ON tutors(user_id);
CREATE INDEX idx_courses_tutor_id     ON courses(tutor_id);
CREATE INDEX idx_enrollments_student  ON enrollments(student_id);
CREATE INDEX idx_enrollments_course   ON enrollments(course_id);
CREATE INDEX idx_attendance_student   ON attendance(student_id);
CREATE INDEX idx_attendance_course    ON attendance(course_id);
CREATE INDEX idx_assignments_course   ON assignments(course_id);
CREATE INDEX idx_submissions_student  ON submissions(student_id);
CREATE INDEX idx_payments_student     ON payments(student_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- The backend uses the service_role key which bypasses RLS.
-- These policies allow full access so the app works correctly.
-- ============================================================
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE students     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;

-- Each table gets its own uniquely named policy
CREATE POLICY "users_all_access"       ON users        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "students_all_access"    ON students     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tutors_all_access"      ON tutors       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "courses_all_access"     ON courses      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enrollments_all_access" ON enrollments  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "attendance_all_access"  ON attendance   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "assignments_all_access" ON assignments  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "submissions_all_access" ON submissions  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "payments_all_access"    ON payments     FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA
-- Passwords (bcrypt hash, cost 12):
--   admin@otms.com   → admin123
--   tutor@otms.com   → tutor123
--   student@otms.com → student123
-- ============================================================
INSERT INTO users (id, name, email, password, role) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Admin User',
    'admin@otms.com',
    '$2a$12$AkbxcuZuNOu8kLyi9Aoovulu22kMpwJaDeGQND/Rr4hA2qlAZi2D6',
    'admin'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'John Tutor',
    'tutor@otms.com',
    '$2a$12$lNeC9EEAUUzUjJgbYFzn0edhdLGpU9TDIWbFlsjoDz42MUzXLHyoq',
    'tutor'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Jane Student',
    'student@otms.com',
    '$2a$12$mpv1HXrh.Gbs08c4kiWe0eT9A/TkJ7OiuDoUCjGFBofMFqqvRd8C2',
    'student'
  );

INSERT INTO tutors (id, user_id, name, email, subject, bio) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'John Tutor',
    'tutor@otms.com',
    'Mathematics',
    'Experienced math tutor with 5+ years of teaching.'
  );

INSERT INTO students (id, user_id, name, email) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'Jane Student',
    'student@otms.com'
  );

INSERT INTO courses (id, tutor_id, title, description, subject, schedule, fee, meet_link) VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Advanced Mathematics',
    'Complete course covering calculus, algebra, and statistics.',
    'Mathematics',
    'Mon/Wed/Fri 6:00 PM',
    2500,
    'https://meet.google.com/abc-defg-hij'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Physics Fundamentals',
    'Mechanics, thermodynamics, and electromagnetism.',
    'Physics',
    'Tue/Thu 5:00 PM',
    2000,
    'https://zoom.us/j/1234567890'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Computer Science Basics',
    'Programming fundamentals, data structures, and algorithms.',
    'Computer Science',
    'Sat/Sun 10:00 AM',
    3000,
    'https://meet.google.com/xyz-uvwx-yz'
  );

-- ============================================================
-- 10. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'danger')),
  link       TEXT,
  read       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_all_access" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SUPABASE STORAGE BUCKET (run separately in SQL editor)
-- Creates the file storage bucket for assignment uploads
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('otms-files', 'otms-files', true)
-- ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE! Your OTMS database is ready.
-- ============================================================
W