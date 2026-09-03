-- CTS (Coach Tracking System) — clean schema for the current phase:
-- Login, Admin, Shell Production, Shell Outturn, Furnish In, Paint In.
-- Informed by (not copied from) the legacy db_ctrack dump; see plan doc for the mapping.

CREATE DATABASE IF NOT EXISTS cts_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cts_dev;

-- ===================== REFERENCE / MASTER (seeded) =====================

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,      -- ADMIN, SHELL_PRODUCTION, FURNISHING, PAINT, ASSEMBLY
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_no VARCHAR(10) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE plants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(5) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE production_years (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year_code VARCHAR(7) NOT NULL UNIQUE,  -- '2021-22'
  start_date DATE NULL,
  end_date DATE NULL
);

CREATE TABLE coach_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(2) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

-- A skill qualifies a user (in role FURNISHING or PAINT) to work on coaches of
-- a given category. Admin-maintained master, per the doc's User -> Role ->
-- Coach Type -> Skill hierarchy (scoped to Furnishing/Paint for this phase).
CREATE TABLE skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role_code VARCHAR(30) NOT NULL,        -- 'FURNISHING' or 'PAINT'
  coach_category_id INT NOT NULL,
  UNIQUE KEY uq_role_category (role_code, coach_category_id),
  FOREIGN KEY (coach_category_id) REFERENCES coach_categories(id)
);

CREATE TABLE user_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  skill_id INT NOT NULL,
  UNIQUE KEY uq_user_skill (user_id, skill_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (skill_id) REFERENCES skills(id)
);

CREATE TABLE coach_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  category_id INT NOT NULL,
  is_lhb TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES coach_categories(id)
);

CREATE TABLE fixed_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coach_type_id INT NOT NULL UNIQUE,
  shell_to_furnishing_days INT NOT NULL DEFAULT 0,   -- rule: always 0 (same event)
  furnishing_to_paint_in_days INT NOT NULL DEFAULT 0,
  paint_in_to_paint_out_days INT NOT NULL DEFAULT 0,
  paint_out_to_assembly_in_days INT NOT NULL DEFAULT 0,
  assembly_in_to_assembly_out_days INT NOT NULL DEFAULT 0,
  assembly_out_to_local_outturn_days INT NOT NULL DEFAULT 0,
  local_outturn_to_dispatch_days INT NOT NULL DEFAULT 0,
  target_total_days INT NOT NULL DEFAULT 0,
  FOREIGN KEY (coach_type_id) REFERENCES coach_types(id)
);

CREATE TABLE paint_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  total_slots INT NOT NULL DEFAULT 10,
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE paint_line_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paint_line_id INT NOT NULL,
  slot_number INT NOT NULL,
  UNIQUE KEY uq_line_slot (paint_line_id, slot_number),
  FOREIGN KEY (paint_line_id) REFERENCES paint_lines(id)
);

CREATE TABLE production_orders (          -- SAP/BO Production Plan, read-only reference
  id INT AUTO_INCREMENT PRIMARY KEY,
  plant_id INT NOT NULL,
  production_year_id INT NOT NULL,
  bo_number VARCHAR(10) NOT NULL,
  bo_item INT NOT NULL,
  bo_date DATE NULL,
  bo_qty INT NOT NULL,
  from_serial VARCHAR(10) NOT NULL,
  to_serial VARCHAR(10) NOT NULL,
  coach_code VARCHAR(10) NULL,
  coach_type_id INT NOT NULL,
  installation_no VARCHAR(18) NULL,
  installation_desc VARCHAR(150) NULL,
  status VARCHAR(30) NULL,
  ref_year VARCHAR(20) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plant_id) REFERENCES plants(id),
  FOREIGN KEY (production_year_id) REFERENCES production_years(id),
  FOREIGN KEY (coach_type_id) REFERENCES coach_types(id)
);

CREATE TABLE coaches (                    -- generated from production_orders ranges at seed time
  id INT AUTO_INCREMENT PRIMARY KEY,
  coach_number VARCHAR(20) NOT NULL UNIQUE,
  serial_no VARCHAR(10) NOT NULL,
  production_order_id INT NOT NULL,
  coach_type_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (production_order_id) REFERENCES production_orders(id),
  FOREIGN KEY (coach_type_id) REFERENCES coach_types(id)
);

-- ===================== TRANSACTIONAL — MUST START EMPTY =====================

CREATE TABLE shell_outturn_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coach_id INT NOT NULL UNIQUE,
  outturn_datetime DATETIME NOT NULL,
  remarks VARCHAR(255) NULL,
  recorded_by_user_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coach_id) REFERENCES coaches(id),
  FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
);

CREATE TABLE furnishing_in_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coach_id INT NOT NULL UNIQUE,
  shell_outturn_id INT NOT NULL UNIQUE,
  furnishing_in_datetime DATETIME NOT NULL,   -- must equal shell_outturn_transactions.outturn_datetime
  recorded_by_user_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coach_id) REFERENCES coaches(id),
  FOREIGN KEY (shell_outturn_id) REFERENCES shell_outturn_transactions(id),
  FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
);

CREATE TABLE furnishing_out_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coach_id INT NOT NULL UNIQUE,
  furnishing_in_id INT NOT NULL UNIQUE,
  furnishing_out_datetime DATETIME NOT NULL,
  remarks VARCHAR(255) NULL,
  recorded_by_user_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coach_id) REFERENCES coaches(id),
  FOREIGN KEY (furnishing_in_id) REFERENCES furnishing_in_records(id),
  FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
);

CREATE TABLE paint_in_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coach_id INT NOT NULL UNIQUE,
  furnishing_out_id INT NOT NULL,
  paint_line_id INT NOT NULL,
  slot_id INT NOT NULL UNIQUE,
  paint_in_datetime DATETIME NOT NULL,
  remarks VARCHAR(255) NULL,
  recorded_by_user_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coach_id) REFERENCES coaches(id),
  FOREIGN KEY (furnishing_out_id) REFERENCES furnishing_out_transactions(id),
  FOREIGN KEY (paint_line_id) REFERENCES paint_lines(id),
  FOREIGN KEY (slot_id) REFERENCES paint_line_slots(id),
  FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
);

-- Tracks who is responsible for the NEXT action on a coach within a module
-- (Furnishing Out for FURNISHING, Paint In for PAINT). Created the moment a
-- coach becomes eligible for that module; a matching under-capacity employee
-- (role + skill covering the coach's category) is assigned immediately,
-- otherwise the row sits QUEUED until capacity frees up. Capacity (max 5
-- concurrent ASSIGNED rows per user per module) is enforced in application
-- code, not a DB constraint, since MySQL check constraints can't easily
-- express "count of related rows".
CREATE TABLE coach_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coach_id INT NOT NULL,
  module VARCHAR(20) NOT NULL,           -- 'FURNISHING' or 'PAINT'
  assigned_user_id INT NULL,             -- NULL while QUEUED
  status VARCHAR(20) NOT NULL DEFAULT 'QUEUED', -- QUEUED, ASSIGNED, COMPLETED
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_at DATETIME NULL,
  completed_at DATETIME NULL,
  UNIQUE KEY uq_coach_module (coach_id, module),
  FOREIGN KEY (coach_id) REFERENCES coaches(id),
  FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);
