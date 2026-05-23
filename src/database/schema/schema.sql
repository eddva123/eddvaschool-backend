-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'institute_admin', 'teacher', 'student', 'parent')),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    experience VARCHAR(50),
    qualification VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Institutes table
CREATE TABLE IF NOT EXISTS institutes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    institute_id INTEGER REFERENCES institutes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Study Materials table
CREATE TABLE IF NOT EXISTS study_materials (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('pdf', 'video', 'doc')),
    size VARCHAR(50),
    file_path VARCHAR(255),
    downloads INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    type VARCHAR(50) DEFAULT 'offline' CHECK (type IN ('offline', 'live', 'recorded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Sessions table
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('homework', 'dpp', 'notes')),
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'upcoming')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assignment Submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(255),
    grade VARCHAR(10),
    status VARCHAR(50) DEFAULT 'submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('topic', 'unit', 'mock', 'subject', 'final')),
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    total_marks INTEGER,
    duration VARCHAR(50),
    date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    marks_obtained INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,
    percentage NUMERIC(5, 2),
    grade VARCHAR(10),
    status VARCHAR(20) DEFAULT 'pass' CHECK (status IN ('pass', 'fail')),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, student_id)
);

-- Performance Reports table
CREATE TABLE IF NOT EXISTS performance_reports (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- e.g., 'monthly', 'unit', 'final'
    average_score NUMERIC(5, 2),
    attendance_rate NUMERIC(5, 2),
    weak_areas JSONB,
    strong_areas JSONB,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grievances table
CREATE TABLE IF NOT EXISTS grievances (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(50) DEFAULT 'medium',
    raised_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) DEFAULT 'individual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Participants table
CREATE TABLE IF NOT EXISTS chat_participants (
    room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (room_id, user_id)
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Presentations table
CREATE TABLE IF NOT EXISTS presentations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slides_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    file_path VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mind Maps table
CREATE TABLE IF NOT EXISTS mind_maps (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    nodes_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
