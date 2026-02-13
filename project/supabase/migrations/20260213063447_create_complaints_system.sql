/*
  # Smart Campus Complaint Management System

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Category name (e.g., Infrastructure, IT, Academics, Hostel, Cafeteria)
      - `description` (text) - Category description
      - `created_at` (timestamptz)
    
    - `complaints`
      - `id` (uuid, primary key)
      - `title` (text) - Complaint title
      - `description` (text) - Detailed complaint description
      - `category_id` (uuid, foreign key) - References categories
      - `status` (text) - Status: pending, in_progress, resolved, closed
      - `priority` (text) - Priority: low, medium, high, urgent
      - `user_id` (uuid, foreign key) - References auth.users
      - `assigned_to` (uuid, nullable) - Admin assigned to handle complaint
      - `resolved_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `comments`
      - `id` (uuid, primary key)
      - `complaint_id` (uuid, foreign key) - References complaints
      - `user_id` (uuid, foreign key) - References auth.users
      - `content` (text) - Comment content
      - `is_internal` (boolean) - Whether comment is internal (admin only)
      - `created_at` (timestamptz)
    
    - `profiles`
      - `id` (uuid, primary key) - References auth.users
      - `email` (text)
      - `full_name` (text)
      - `role` (text) - Role: student, admin
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Students can create complaints and view their own complaints
    - Students can add comments to their own complaints
    - Admins can view all complaints and manage them
    - Admins can add comments to any complaint
    - Categories are readable by all authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Infrastructure', 'Issues related to buildings, classrooms, and facilities'),
  ('IT & Technology', 'Computer labs, Wi-Fi, software, and hardware issues'),
  ('Academics', 'Course-related issues, exam schedules, and academic concerns'),
  ('Hostel', 'Hostel facilities, maintenance, and accommodation issues'),
  ('Cafeteria', 'Food quality, hygiene, and cafeteria services'),
  ('Transportation', 'Campus transportation and parking issues'),
  ('Library', 'Library resources, access, and facilities'),
  ('Sports & Recreation', 'Sports facilities and recreational activities'),
  ('Security', 'Safety and security concerns on campus'),
  ('Other', 'General complaints and suggestions')
ON CONFLICT (name) DO NOTHING;

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own complaints"
  ON complaints FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Users can create complaints"
  ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own complaints"
  ON complaints FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their complaints"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaints 
      WHERE complaints.id = comments.complaint_id 
      AND (complaints.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      ))
    )
    AND (NOT is_internal OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
  );

CREATE POLICY "Users can add comments to their complaints"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM complaints 
        WHERE complaints.id = comments.complaint_id 
        AND complaints.user_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_category_id ON complaints(category_id);
CREATE INDEX IF NOT EXISTS idx_comments_complaint_id ON comments(complaint_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for complaints table
DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints;
CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();