-- CTS seed data: reference/master tables only.
-- Transactional tables (shell_outturn_transactions, furnishing_in_records,
-- paint_in_transactions) intentionally get ZERO rows here — they fill up as
-- real users submit data through the UI.
--
-- Reference data below is cleaned up from the legacy db_ctrack dump
-- (tbl_plant, tbl_prodyear, tbl_coach_categories, tbl_coach_types,
-- tbl_coach_schedule, tbl_valid_bos) with clean names, not copied verbatim.

USE cts_dev;

-- ===================== Roles =====================
-- Full role list per the functional doc's User & Responsibility Model (section 3).
-- Every role gets its own login. Only ADMIN, SHELL_PRODUCTION, FURNISHING and
-- PAINT have working pages in this phase — the rest are seeded now (login-only)
-- so accounts exist ahead of their modules being built, per the user's request
-- for a separate login per role. Coach-type/skill/operation-level filtering
-- (User -> Role -> Coach Type -> Skill -> Operation/Stage) is intentionally
-- NOT implemented yet — role-level access only, as agreed.

INSERT INTO roles (id, code, name, description) VALUES
(1,  'ADMIN',                 'Admin',                        'System configuration and governance'),
(2,  'PRODUCTION_PLANNING',   'Production Planning',          'Imports/verifies SAP/BO plan and coach master data'),
(3,  'SHELL_PRODUCTION',      'Shell Production',             'Updates Shell production and records Shell Outturn'),
(4,  'FURNISHING',            'Furnishing',                   'Views released coaches and performs furnishing transactions'),
(5,  'PAINT',                 'Paint',                        'Paint In / Paint Out and line handling'),
(6,  'ASSEMBLY_PRODUCTION',   'Assembly Production',          'Performs Assembly In and marks assigned operations completed'),
(7,  'MECHANICAL_INSPECTION', 'Mechanical Inspection',        'Completes assigned mechanical inspection/clearance operations'),
(8,  'ELECTRICAL_INSPECTION', 'Electrical Inspection',        'Completes assigned electrical inspection/clearance operations'),
(9,  'SHUNTING_STAFF',        'Shunting Staff',               'Records authorized coach movement between lines/locations'),
(10, 'VENDOR_SNI',            'Vendor / SNI User',            'Updates only assigned vendor/SNI operations'),
(11, 'FINAL_INSPECTION',      'Final Inspection / Clearance', 'Completes required final checks and supports Assembly Out readiness'),
(12, 'OUTTURN_DISPATCH',      'Outturn / Dispatch',           'Local Outturn, Lock & Seal, Board Outturn and Dispatch'),
(13, 'MANAGEMENT_VIEWER',     'Management / Viewer',          'Read-only dashboards and reports unless separately authorized');

-- ===================== Demo users =====================
-- One login per role. All demo users share the password: Passw0rd!

INSERT INTO users (id, employee_no, full_name, username, password_hash, role_id) VALUES
(1,  'E1001', 'A. Sundaram',    'admin1',      '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 1),
(2,  'E1002', 'V. Elango',      'planning1',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 2),
(3,  'E1003', 'R. Meena',       'shell1',      '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 3),
(4,  'E1004', 'K. Priya',       'furnish1',    '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 4),
(5,  'E1005', 'S. Ramesh',      'paint1',      '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5),
(6,  'E1006', 'M. Kumar',       'assemble1',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(7,  'E1007', 'D. Suresh',      'mechinsp1',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 7),
(8,  'E1008', 'N. Bala',        'elecinsp1',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 8),
(9,  'E1009', 'P. Anbu',        'shunt1',      '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 9),
(10, 'E1010', 'J. Vendor',      'vendor1',     '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 10),
(11, 'E1011', 'T. Karthik',     'finalinsp1',  '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 11),
(12, 'E1012', 'G. Vijay',       'dispatch1',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 12),
(13, 'E1013', 'L. Manager',     'viewer1',     '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 13),
-- A second Paint employee so the skill-based assignment queue (capped at 5
-- concurrent per employee) has more than one candidate to load-balance
-- across. Furnishing is deliberately single-employee (furnish1 only) — that
-- module has no cap, so a second Furnishing login would just sit idle.
(15, 'E1015', 'V. Raja',        'paint2',      '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5),
-- Assembly, same split as Paint: separate logins per direction — assemble1
-- only handles Assembly In, assemble2 only handles Assembly Out.
(16, 'E1016', 'S. Karthikeyan', 'assemble2',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
-- Outturn/Dispatch, same split again: one login per stage — dispatch1 =
-- Local Outturn, dispatch2 = Lock & Seal, dispatch3 = Railway Board
-- Outturn, dispatch4 = Physical Dispatch.
(17, 'E1017', 'M. Rajesh',      'dispatch2',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 12),
(18, 'E1018', 'A. Saravanan',   'dispatch3',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 12),
(19, 'E1019', 'R. Elumalai',    'dispatch4',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 12);

-- Real Assembly Shop supervisors (Sr.Sec.Engr grade), sourced from the
-- factory's cug employee directory: payunit '30A' (Assembly/Fur.) with
-- scalecd '274' identifies this specific grade/section. employee_no is
-- their real railway employee number. These populate the Assembly
-- Assignments matrix with a realistic supervisor roster — none are
-- pre-configured with matrix cells (that's Admin's job via the UI), except
-- assemble1/assemble2 below which keep their existing In/Out config.
INSERT INTO users (id, employee_no, full_name, username, password_hash, role_id) VALUES
(20, '694583', 'Amuda Ganesan S', 'amudag', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(21, '683788', 'Nachiappan N', 'nachiappann', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(22, '827809', 'Anandan C', 'anandanc', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(23, '821773', 'Jeyakrishna D V', 'jeyakrishnad', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(24, '771526', 'Venkatesan K', 'venkatesank', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(25, '789232', 'Satish Kumar B', 'satishk', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(26, '827497', 'Prabhakar', 'prabhakar', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(27, '802257', 'Suresh P', 'sureshp', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(28, '805634', 'Parthasarathy V', 'parthasarathyv', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(29, '785936', 'Jeyakumar J', 'jeyakumarj', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(30, '858795', 'Deepak S', 'deepaks', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(31, '841598', 'Vikas Oraon', 'vikaso', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(32, '825766', 'Madhankumar B', 'madhankumarb', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(33, '833555', 'Jayapal M', 'jayapalm', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(34, '835171', 'Suresh Selvakumar R', 'sureshs', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(35, '857143', 'Hariharan K', 'hariharank', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(36, '843868', 'Vijaya Kumar G', 'vijayak', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(37, '868740', 'Mohan Raj A', 'mohanr', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(38, '865119', 'John Marshall M', 'johnm', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(39, '865670', 'Suresh Kumar M', 'sureshk', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(40, '868774', 'Venkatesan T', 'venkatesant', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(41, '823437', 'Sundaramurthy S', 'sundaramurthys', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(42, '864941', 'Poornachandran B', 'poornachandranb', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(43, '864095', 'Satish Kumar G', 'satishk2', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(44, '865389', 'Ranjith K', 'ranjithk', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(45, '832350', 'Murugesan C', 'murugesanc', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(46, '831672', 'Periyasamy S', 'periyasamys', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(47, '855017', 'Prithu U N', 'prithuu', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(48, '856167', 'Ragul M', 'ragulm', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(49, '855236', 'Karthik H', 'karthikh', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(50, '852967', 'Natarajan R', 'natarajanr', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(51, '828764', 'Velmurugan S', 'velmurugans', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(52, '862428', 'Suresh Babu D', 'sureshb', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(53, '871383', 'Sivakumar N', 'sivakumarn', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(54, '890832', 'Annapureddy Abhishek Reddy', 'annapureddya', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(55, '881910', 'Prabhakaran A', 'prabhakarana', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(56, '884969', 'Saravanaselvan R', 'saravanaselvanr', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(57, '885291', 'Gautam Krishna U', 'gautamk', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(58, '885515', 'Ajith P S', 'ajithp', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(59, '885081', 'Gopinath S', 'gopinaths', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(60, '885072', 'Seran P', 'seranp', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(61, '885208', 'Venkat Nayak M', 'venkatn', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(62, '885216', 'Dharmendra', 'dharmendra', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(63, '805028', 'Sankara Gurunathan A', 'sankarag', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(64, '838006', 'Dusmanta Kumar Das', 'dusmantak', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(65, '853345', 'Vijai Ambedkar K', 'vijaia', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(66, '795659', 'Suresh C', 'sureshc', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(67, '802118', 'Bilal Mohamed M', 'bilalm', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(68, '858787', 'Yogha Sinivasa P', 'yoghas', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6);

-- Real Paint Shop supervisors (Sr.Sec.Engr grade), same cug directory
-- source as the Assembly roster above: payunit '54A' (Paint-Fur) with
-- scalecd '274' identifies this exact grade/section. Populates the Paint
-- Assignments matrix with a realistic supervisor roster alongside
-- paint1/paint2 — none pre-configured with matrix cells.
INSERT INTO users (id, employee_no, full_name, username, password_hash, role_id) VALUES
(69, '827518', 'Makesh Babu N S', 'makeshb', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5),
(70, '825651', 'Periyannan R', 'periyannanr', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5),
(71, '697371', 'Kumar R', 'kumarr', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5),
(72, '833643', 'Sivasankarareddy Pynam', 'sivasankarareddyp', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5),
(73, '832341', 'Suresh R', 'sureshr', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5),
(74, '831883', 'Chandrasekaran S', 'chandrasekarans', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5),
(75, '830311', 'Samadurai P', 'samaduraip', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5),
(76, '855025', 'Sundar K', 'sundark', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5),
(77, '880941', 'Guru Prasad A', 'gurup', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5),
(78, '885321', 'Sarun Thambi K', 'sarunt', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5),
(79, '885355', 'Vishnuprasad C G', 'vishnuprasadc', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5);

-- ===================== Plants =====================
-- Matches the legacy BO reference's leading token (e.g. "FURN | 2025 | ...").

INSERT INTO plants (id, code, name) VALUES
(1, 'FURN', 'Furnishing Installation (ICF)'),
(2, 'SHLL', 'Shell Installation (ICF)');

-- ===================== Production years =====================

INSERT INTO production_years (id, year_code, start_date, end_date) VALUES
(1, '2020-21', '2020-04-01', '2021-03-31'),
(2, '2021-22', '2021-04-01', '2022-03-31'),
(3, '2022-23', '2022-04-01', '2023-03-31'),
(4, '2023-24', '2023-04-01', '2024-03-31'),
(5, '2024-25', '2024-04-01', '2025-03-31'),
(6, '2025-26', '2025-04-01', '2026-03-31'),
(7, '2026-27', '2026-04-01', '2027-03-31'),
(8, '2027-28', '2027-04-01', '2028-03-31'),
(9, '2028-29', '2028-04-01', '2029-03-31'),
(10, '2029-30', '2029-04-01', '2030-03-31');

-- ===================== Coach categories =====================

INSERT INTO coach_categories (id, code, name, sort_order, is_active) VALUES
(1, '08', 'LHB AC', 8, 1),
(2, '09', 'LHB NON-AC', 9, 1);

-- ===================== Skills =====================
-- Skill = "can perform this OPERATION on this coach category". FURNISHING_IN
-- and the four Outturn/Dispatch operations are live here. Paint and Assembly
-- do NOT use this table for either direction — each has its own,
-- finer-grained `*_type_assignments` matrix instead (per coach TYPE, not
-- category, with separate In/Out flags), configured via the Admin
-- "Supervisor-Coach Assignments Matrix" pages.

INSERT INTO skills (id, name, operation, role_code, coach_category_id) VALUES
(1, 'Furnishing In - LHB AC', 'FURNISHING_IN', 'FURNISHING', 1),
(2, 'Furnishing In - LHB Non-AC', 'FURNISHING_IN', 'FURNISHING', 2),
(7, 'Local Outturn - LHB AC', 'LOCAL_OUTTURN', 'OUTTURN_DISPATCH', 1),
(8, 'Local Outturn - LHB Non-AC', 'LOCAL_OUTTURN', 'OUTTURN_DISPATCH', 2),
(9, 'Lock & Seal - LHB AC', 'LOCK_SEAL', 'OUTTURN_DISPATCH', 1),
(10, 'Lock & Seal - LHB Non-AC', 'LOCK_SEAL', 'OUTTURN_DISPATCH', 2),
(11, 'Railway Board Outturn - LHB AC', 'BOARD_OUTTURN', 'OUTTURN_DISPATCH', 1),
(12, 'Railway Board Outturn - LHB Non-AC', 'BOARD_OUTTURN', 'OUTTURN_DISPATCH', 2),
(13, 'Physical Dispatch - LHB AC', 'PHYSICAL_DISPATCH', 'OUTTURN_DISPATCH', 1),
(14, 'Physical Dispatch - LHB Non-AC', 'PHYSICAL_DISPATCH', 'OUTTURN_DISPATCH', 2);

-- ===================== User skills =====================
-- furnish1 covers both categories — every coach past Shell Outturn is
-- assigned to them, uncapped (see Assignment::MODULE_CAPACITY).
-- Outturn/Dispatch uses the same one-login-per-stage split as Paint/
-- Assembly, each across both categories, uncapped (no lines/capacity
-- concept for these four stages, unlike Paint/Assembly).

INSERT INTO user_skills (user_id, skill_id) VALUES
(4, 1),  -- furnish1: LHB AC Furnishing
(4, 2),  -- furnish1: LHB Non-AC Furnishing
(12, 7), (12, 8),   -- dispatch1: Local Outturn (both categories)
(17, 9), (17, 10),  -- dispatch2: Lock & Seal (both categories)
(18, 11), (18, 12), -- dispatch3: Railway Board Outturn (both categories)
(19, 13), (19, 14); -- dispatch4: Physical Dispatch (both categories)

-- ===================== Coach types =====================
-- Codes/names match the legacy tbl_coach_types active rows for these categories.

INSERT INTO coach_types (id, code, name, category_id, is_lhb, is_active, sort_order) VALUES
(1, '0038', 'LWLRRM', 1, 1, 1, 1),
(2, '0026', 'LWFAC', 1, 1, 1, 2),
(3, '0023', 'LWACCW', 1, 1, 1, 3),
(4, '0021', 'LWACCN', 1, 1, 1, 4),
(5, '0024', 'LWCBAC', 1, 1, 1, 5),
(6, '0035', 'LWSCN', 2, 1, 1, 6),
(7, '0034', 'LSLRD', 2, 1, 1, 7);

-- ===================== Paint type assignments (matrix) =====================
-- paint1 = Paint In, paint2 = Paint Out, both across every seeded coach type.
-- Paint In assignment still respects the 5-concurrent cap and QUEUEs
-- overflow (Assignment::MODULE_CAPACITY['PAINT']) — this table only decides
-- *eligibility* (who can be assigned), not capacity.

INSERT INTO paint_type_assignments (user_id, coach_type_id, can_in, can_out) VALUES
(5, 1, 1, 0), (5, 2, 1, 0), (5, 3, 1, 0), (5, 4, 1, 0), (5, 5, 1, 0), (5, 6, 1, 0), (5, 7, 1, 0), -- paint1: Paint In, all types
(15, 1, 0, 1), (15, 2, 0, 1), (15, 3, 0, 1), (15, 4, 0, 1), (15, 5, 0, 1), (15, 6, 0, 1), (15, 7, 0, 1); -- paint2: Paint Out, all types

-- ===================== Assembly type assignments (matrix) =====================
-- Same structure as the Paint matrix above: assemble1 = Assembly In,
-- assemble2 = Assembly Out, both across every seeded coach type. The 49 real
-- supervisor logins seeded above are intentionally left unconfigured here —
-- Admin assigns them coach types via /admin/assembly-assignments.

INSERT INTO assembly_type_assignments (user_id, coach_type_id, can_in, can_out) VALUES
(6, 1, 1, 0), (6, 2, 1, 0), (6, 3, 1, 0), (6, 4, 1, 0), (6, 5, 1, 0), (6, 6, 1, 0), (6, 7, 1, 0), -- assemble1: Assembly In, all types
(16, 1, 0, 1), (16, 2, 0, 1), (16, 3, 0, 1), (16, 4, 0, 1), (16, 5, 0, 1), (16, 6, 0, 1), (16, 7, 0, 1); -- assemble2: Assembly Out, all types

-- ===================== Fixed schedules =====================
-- Admin-configured static day-counts (not predicted). shell_to_furnishing_days
-- is always 0 — Shell Outturn and Furnishing In are the same event.

INSERT INTO fixed_schedules
  (coach_type_id, shell_to_furnishing_days, furnishing_to_paint_in_days, paint_in_to_paint_out_days,
   paint_out_to_assembly_in_days, assembly_in_to_assembly_out_days, assembly_out_to_local_outturn_days,
   local_outturn_to_dispatch_days, target_total_days)
VALUES
(1, 0, 1, 4, 1, 20, 1, 1, 28),
(2, 0, 1, 4, 1, 20, 1, 1, 28),
(3, 0, 1, 4, 1, 20, 1, 1, 28),
(4, 0, 1, 4, 1, 20, 1, 1, 28),
(5, 0, 1, 4, 1, 20, 1, 1, 28),
(6, 0, 1, 4, 1, 20, 1, 1, 28),
(7, 0, 1, 4, 1, 20, 1, 1, 28);

-- ===================== Paint lines & slots =====================
-- Maximum capacity of 10 coaches per line (functional doc requirement).

INSERT INTO paint_lines (id, code, name, total_slots) VALUES
(1, 'PL1', 'Paint Line 1', 10),
(2, 'PL2', 'Paint Line 2', 10),
(3, 'PL3', 'Paint Line 3', 10),
(4, 'PL4', 'Paint Line 4', 10),
(5, 'PL5', 'Paint Line 5', 10),
(6, 'PL6', 'Paint Line 6', 10),
(7, 'PL7', 'Paint Line 7', 10),
(8, 'PL8', 'Paint Line 8', 10),
(9, 'PL9', 'Paint Line 9', 10),
(10, 'PL10', 'Paint Line 10', 10);

INSERT INTO paint_line_slots (paint_line_id, slot_number)
SELECT pl.id, n.slot_number
FROM paint_lines pl
JOIN (
  SELECT 1 AS slot_number UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
  UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
) n;

-- ===================== Paint Out / Assembly In / Assembly Out lines & slots =====================
-- Same 10-line x 10-slot capacity as Paint (confirmed requirement), each
-- stage with its own independent pool.

INSERT INTO paint_out_lines (id, code, name, total_slots) VALUES
(1, 'POL1', 'Paint Out Line 1', 10), (2, 'POL2', 'Paint Out Line 2', 10), (3, 'POL3', 'Paint Out Line 3', 10),
(4, 'POL4', 'Paint Out Line 4', 10), (5, 'POL5', 'Paint Out Line 5', 10), (6, 'POL6', 'Paint Out Line 6', 10),
(7, 'POL7', 'Paint Out Line 7', 10), (8, 'POL8', 'Paint Out Line 8', 10), (9, 'POL9', 'Paint Out Line 9', 10),
(10, 'POL10', 'Paint Out Line 10', 10);

INSERT INTO paint_out_line_slots (paint_out_line_id, slot_number)
SELECT pl.id, n.slot_number
FROM paint_out_lines pl
JOIN (
  SELECT 1 AS slot_number UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
  UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
) n;

INSERT INTO assembly_in_lines (id, code, name, total_slots) VALUES
(1, 'AIL1', 'Assembly In Line 1', 10), (2, 'AIL2', 'Assembly In Line 2', 10), (3, 'AIL3', 'Assembly In Line 3', 10),
(4, 'AIL4', 'Assembly In Line 4', 10), (5, 'AIL5', 'Assembly In Line 5', 10), (6, 'AIL6', 'Assembly In Line 6', 10),
(7, 'AIL7', 'Assembly In Line 7', 10), (8, 'AIL8', 'Assembly In Line 8', 10), (9, 'AIL9', 'Assembly In Line 9', 10),
(10, 'AIL10', 'Assembly In Line 10', 10);

INSERT INTO assembly_in_line_slots (assembly_in_line_id, slot_number)
SELECT al.id, n.slot_number
FROM assembly_in_lines al
JOIN (
  SELECT 1 AS slot_number UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
  UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
) n;

INSERT INTO assembly_out_lines (id, code, name, total_slots) VALUES
(1, 'AOL1', 'Assembly Out Line 1', 10), (2, 'AOL2', 'Assembly Out Line 2', 10), (3, 'AOL3', 'Assembly Out Line 3', 10),
(4, 'AOL4', 'Assembly Out Line 4', 10), (5, 'AOL5', 'Assembly Out Line 5', 10), (6, 'AOL6', 'Assembly Out Line 6', 10),
(7, 'AOL7', 'Assembly Out Line 7', 10), (8, 'AOL8', 'Assembly Out Line 8', 10), (9, 'AOL9', 'Assembly Out Line 9', 10),
(10, 'AOL10', 'Assembly Out Line 10', 10);

INSERT INTO assembly_out_line_slots (assembly_out_line_id, slot_number)
SELECT al.id, n.slot_number
FROM assembly_out_lines al
JOIN (
  SELECT 1 AS slot_number UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
  UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
) n;

-- ===================== SAP/BO Production Plan (read-only reference) =====================
-- A representative slice of real BO furnishing-installation orders from tbl_valid_bos,
-- covering all seeded coach types.

INSERT INTO production_orders
  (id, plant_id, production_year_id, bo_number, bo_item, bo_date, bo_qty, from_serial, to_serial, coach_code, coach_type_id, installation_no, installation_desc, status, ref_year)
VALUES
(1, 1, 5, '330643', 1, '2024-03-04', 7, '889', '895', 'F613', 1, 'F6139010000002', 'LWLRRM EOG FURN INST ANX-11', 'ACTIVE', 'BOF-2024-25'),
(2, 1, 5, '350815', 2, '2024-05-28', 10, '279', '288', 'F856', 5, 'F8569000200002', 'LWCBAC FURN INSTALLATION', 'ACTIVE', 'BOF-2024-25'),
(3, 1, 5, '360990', 1, '2024-05-28', 5, '352', '356', 'F632', 2, 'F63290022000FU', 'LWFAC EOG FURN INSTN (RCF DRGS)', 'ACTIVE', 'BOF-2024-25'),
(4, 1, 5, '360737', 1, '2024-06-22', 5, '1483', '1487', 'F593', 3, 'F5939000200004', 'LWSCWAC FURN INSTALLATION', 'ACTIVE', 'BOF-2024-25'),
(5, 1, 5, '360737', 2, '2024-08-13', 2, '1488', '1489', 'F593', 3, 'F5939000200004', 'LWSCWAC FURN INSTALLATION', 'ACTIVE', 'BOF-2024-25'),
(6, 1, 5, '360738', 1, '2025-01-23', 4, '1496', '1499', 'F593', 3, 'F5939000200004', 'LWSCWAC FURN INSTALLATION', 'ACTIVE', 'BOF-2024-25'),
(7, 1, 5, '340888', 1, '2024-03-14', 24, '574', '597', 'F741', 7, 'F74190002NEW02', 'LSLRD NEW GENRL INSTN FURN', 'ACTIVE', 'BOF-2024-25'),
(8, 1, 5, '340912', 2, '2024-04-10', 16, '4363', '4378', 'F783', 6, 'F7839000200002', 'LWSCN FURN INSTALLATION', 'ACTIVE', 'BOF-2024-25'),
(9, 1, 5, '360566', 2, '2024-02-14', 22, '3129', '3150', 'F767', 4, 'F7679020300002', 'LWACCN2 EOG 160KN ASR FIATB FURN GEN INS', 'ACTIVE', 'BOF-2024-25');

-- ===================== Coaches =====================
-- Pre-generated by expanding each production order's from_serial..to_serial
-- range — this is what populates the Shell Outturn Entry screen's "eligible
-- coach numbers" dropdown before any transaction exists.

INSERT INTO coaches (id, coach_number, serial_no, production_order_id, coach_type_id)
VALUES
(1, '889', '889', 1, 1),
(2, '890', '890', 1, 1),
(3, '891', '891', 1, 1),
(4, '892', '892', 1, 1),
(5, '893', '893', 1, 1),
(6, '894', '894', 1, 1),
(7, '895', '895', 1, 1),
(8, '279', '279', 2, 5),
(9, '280', '280', 2, 5),
(10, '281', '281', 2, 5),
(11, '282', '282', 2, 5),
(12, '283', '283', 2, 5),
(13, '284', '284', 2, 5),
(14, '285', '285', 2, 5),
(15, '286', '286', 2, 5),
(16, '287', '287', 2, 5),
(17, '288', '288', 2, 5),
(18, '352', '352', 3, 2),
(19, '353', '353', 3, 2),
(20, '354', '354', 3, 2),
(21, '355', '355', 3, 2),
(22, '356', '356', 3, 2),
(23, '1483', '1483', 4, 3),
(24, '1484', '1484', 4, 3),
(25, '1485', '1485', 4, 3),
(26, '1486', '1486', 4, 3),
(27, '1487', '1487', 4, 3),
(28, '1488', '1488', 5, 3),
(29, '1489', '1489', 5, 3),
(30, '1496', '1496', 6, 3),
(31, '1497', '1497', 6, 3),
(32, '1498', '1498', 6, 3),
(33, '1499', '1499', 6, 3),
(34, '574', '574', 7, 7),
(35, '575', '575', 7, 7),
(36, '576', '576', 7, 7),
(37, '577', '577', 7, 7),
(38, '578', '578', 7, 7),
(39, '579', '579', 7, 7),
(40, '580', '580', 7, 7),
(41, '581', '581', 7, 7),
(42, '582', '582', 7, 7),
(43, '583', '583', 7, 7),
(44, '584', '584', 7, 7),
(45, '585', '585', 7, 7),
(46, '586', '586', 7, 7),
(47, '587', '587', 7, 7),
(48, '588', '588', 7, 7),
(49, '589', '589', 7, 7),
(50, '590', '590', 7, 7),
(51, '591', '591', 7, 7),
(52, '592', '592', 7, 7),
(53, '593', '593', 7, 7),
(54, '594', '594', 7, 7),
(55, '595', '595', 7, 7),
(56, '596', '596', 7, 7),
(57, '597', '597', 7, 7),
(58, '4363', '4363', 8, 6),
(59, '4364', '4364', 8, 6),
(60, '4365', '4365', 8, 6),
(61, '4366', '4366', 8, 6),
(62, '4367', '4367', 8, 6),
(63, '4368', '4368', 8, 6),
(64, '4369', '4369', 8, 6),
(65, '4370', '4370', 8, 6),
(66, '4371', '4371', 8, 6),
(67, '4372', '4372', 8, 6),
(68, '4373', '4373', 8, 6),
(69, '4374', '4374', 8, 6),
(70, '4375', '4375', 8, 6),
(71, '4376', '4376', 8, 6),
(72, '4377', '4377', 8, 6),
(73, '4378', '4378', 8, 6),
(74, '3129', '3129', 9, 4),
(75, '3130', '3130', 9, 4),
(76, '3131', '3131', 9, 4),
(77, '3132', '3132', 9, 4),
(78, '3133', '3133', 9, 4),
(79, '3134', '3134', 9, 4),
(80, '3135', '3135', 9, 4),
(81, '3136', '3136', 9, 4),
(82, '3137', '3137', 9, 4),
(83, '3138', '3138', 9, 4),
(84, '3139', '3139', 9, 4),
(85, '3140', '3140', 9, 4),
(86, '3141', '3141', 9, 4),
(87, '3142', '3142', 9, 4),
(88, '3143', '3143', 9, 4),
(89, '3144', '3144', 9, 4),
(90, '3145', '3145', 9, 4),
(91, '3146', '3146', 9, 4),
(92, '3147', '3147', 9, 4),
(93, '3148', '3148', 9, 4),
(94, '3149', '3149', 9, 4),
(95, '3150', '3150', 9, 4);

-- ===================== Transactional tables: intentionally empty =====================
-- shell_outturn_transactions, furnishing_in_records, paint_in_transactions,
-- coach_assignments start with zero rows. They fill up as real users submit
-- data through the UI (coach_assignments is populated automatically by the
-- assignment engine as coaches become eligible).
