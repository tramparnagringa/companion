-- Refactor user roles:
-- 'student' (no access, pending) → 'pending'
-- 'bootcamp' + 'mentoria' (has access) → 'student'

-- Migrate existing data
UPDATE profiles SET role = 'pending' WHERE role = 'student';
UPDATE profiles SET role = 'student' WHERE role IN ('bootcamp', 'mentoria');

-- Update constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('pending', 'student', 'mentor', 'admin'));

-- Update default
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'pending';
