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
-- PRODUCTION_PLANNING, SHUNTING_STAFF, FINAL_INSPECTION and MANAGEMENT_VIEWER
-- were seeded login-only in an earlier phase and later removed once confirmed
-- nothing in the app referenced them (no nav items, routes, or dashboard
-- branches) — see git history if one of them needs reviving.

INSERT INTO roles (id, code, name, description) VALUES
(1,  'ADMIN',                 'Admin',                        'System configuration and governance'),
(3,  'SHELL_PRODUCTION',      'Shell Production',             'Updates Shell production and records Shell Outturn'),
(4,  'FURNISHING',            'Furnishing',                   'Views released coaches and performs furnishing transactions'),
(5,  'PAINT',                 'Paint',                        'Paint In / Paint Out and line handling'),
(6,  'ASSEMBLY_PRODUCTION',   'Assembly Production',          'Performs Assembly In and marks assigned operations completed'),
(7,  'MECHANICAL_INSPECTION', 'Mechanical Inspection',        'Completes assigned mechanical inspection/clearance operations'),
(8,  'ELECTRICAL_INSPECTION', 'Electrical Inspection',        'Completes assigned electrical inspection/clearance operations'),
(10, 'VENDOR_SNI',            'Vendor / SNI User',            'Records/views coaches for one assigned paint vendor (ICF/A/B/C)'),
(12, 'OUTTURN_DISPATCH',      'Outturn / Dispatch',           'Local Outturn, Lock & Seal, Board Outturn and Dispatch'),
-- Scoped sub-admins: Admin no longer creates PAINT/ASSEMBLY_PRODUCTION
-- workers directly — that's delegated to these two roles, each restricted
-- to their own shop's worker logins and assignment matrix.
(14, 'PAINT_ADMIN',           'Paint Admin',                  'Manages Paint Shop worker logins and the coach-type assignment matrix'),
(15, 'ASSEMBLY_ADMIN',        'Assembly Admin',               'Manages Assembly Shop worker logins and the coach-type assignment matrix'),
-- Sub-operation worker: Assembly Admin creates these logins and assigns each
-- one any combination of the 32 Assembly Operations (see assembly_operations
-- below) — distinct from ASSEMBLY_PRODUCTION, which handles Assembly In/Out.
(16, 'ASSEMBLY_OPERATION',    'Assembly Operation',           'Performs a specific assembly sub-operation, assigned by Assembly Admin');

-- ===================== Demo users =====================
-- One login per role. All demo users share the password: Passw0rd!

INSERT INTO users (id, employee_no, full_name, username, password_hash, role_id) VALUES
(1,  'E1001', 'A. Sundaram',    'admin1',      '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 1),
(3,  'E1003', 'R. Meena',       'shell1',      '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 3),
(4,  'E1004', 'K. Priya',       'furnish1',    '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 4),
(5,  'E1005', 'S. Ramesh',      'paint1',      '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 5),
(6,  'E1006', 'M. Kumar',       'assemble1',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 6),
(7,  'E1007', 'D. Suresh',      'mechinsp1',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 7),
(8,  'E1008', 'N. Bala',        'elecinsp1',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 8),
(10, 'E1010', 'J. Vendor',      'vendor1',     '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 10),
(12, 'E1012', 'G. Vijay',       'dispatch1',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 12),
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
(19, 'E1019', 'R. Elumalai',    'dispatch4',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 12),
-- Scoped sub-admins (see roles 14/15 above): each manages only their own
-- shop's worker logins plus that shop's coach-type assignment matrix.
-- IDs deliberately out past the imported real rosters (20-81) below.
(82, 'E1082', 'P. Anand',       'paintadmin1',    '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 14),
(83, 'E1083', 'A. Bhavani',     'assemblyadmin1', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 15);

-- One login per paint vendor (role VENDOR_SNI), each scoped via
-- assigned_vendor to see only its own coaches (see vendor/coaches.php) — ICF
-- represents in-house work, A/B/C are placeholder external vendor codes.
-- The original unscoped vendor1 (id 10, role-level access only) is left as-is.
INSERT INTO users (id, employee_no, full_name, username, password_hash, role_id, assigned_vendor) VALUES
(84, 'E1084', 'ICF Vendor Desk', 'vendor_icf', '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 10, 'ICF'),
(85, 'E1085', 'Vendor A Desk',   'vendor_a',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 10, 'A'),
(86, 'E1086', 'Vendor B Desk',   'vendor_b',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 10, 'B'),
(87, 'E1087', 'Vendor C Desk',   'vendor_c',   '$2b$10$mhJB6MWMnvLgmLoQmusGjuDK89xZtfMqWHhdJcgKvXhXSK4nq7uFq', 10, 'C');

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
-- '08'/'09' (LHB AC / LHB NON-AC) are CTS's original two categories, used by
-- every live workflow (skills, line pools, production orders). The rest are
-- imported from ICF's legacy `tbl_coach_schedule` alongside the coach types
-- below, covering ICF's full fleet (EMU/MEMU/Metro/Train 18/etc.) even though
-- only LHB types are operationally used elsewhere in the app today. Their
-- names are a best-guess from the coach names in each category, not
-- confirmed ICF terminology — rename via the Admin Schedule page as needed.

INSERT INTO coach_categories (id, code, name, sort_order, is_active) VALUES
(1, '08', 'LHB AC', 8, 1),
(2, '09', 'LHB NON-AC', 9, 1),
(3, '01', 'AC EMU', 10, 1),
(4, '02', 'MEMU', 11, 1),
(5, '03', 'Metro', 12, 1),
(6, '04', 'Train 18 / Vande Bharat', 13, 1),
(7, '05', 'SPART', 14, 1),
(8, '06', 'DETC', 15, 1),
(9, '07', 'SPIC', 16, 1),
(10, '10', 'MG NMR', 17, 1),
(11, '11', 'DMU', 18, 1),
(12, '12', 'AC EMU', 19, 1),
(13, '13', 'Non-AC EMU / MBU', 20, 1);

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
-- Codes/names for ids 1-7 match the legacy tbl_coach_types active rows for
-- these categories. ids 8-181 are imported from ICF's legacy
-- `tbl_coach_schedule` export (see fixed_schedules below, sourced from the
-- same file) — `code` there is that file's shell code (tcs_coachid_shl),
-- since its own tcs_coachid isn't unique across rows. Note "LSLRD" (id 7)
-- has no exact-name match in that file (closest is "LSLRD without DA set",
-- imported separately as id 29) — its schedule below is still the original
-- placeholder, not real data, until someone confirms which row it should be.

INSERT INTO coach_types (id, code, name, category_id, is_lhb, is_active, sort_order) VALUES
(1, '0038', 'LWLRRM', 1, 1, 1, 1),
(2, '0026', 'LWFAC', 1, 1, 1, 2),
(3, '0023', 'LWACCW', 1, 1, 1, 3),
(4, '0021', 'LWACCN', 1, 1, 1, 4),
(5, '0024', 'LWCBAC', 1, 1, 1, 5),
(6, '0035', 'LWSCN', 2, 1, 1, 6),
(7, '0034', 'LSLRD', 2, 1, 1, 7),
(8, 'C0040102', 'AC EMU DMC BHEL', 3, 0, 1, 8),
(9, 'C0040101', 'AC EMU TC BHEL', 3, 0, 1, 9),
(10, 'C0180102', 'AC EMU B 3PH', 12, 0, 1, 10),
(11, 'C0180103', 'AC EMU C 3PH', 12, 0, 1, 11),
(12, 'C0180104', 'AC EMU D 3PH', 12, 0, 1, 12),
(13, 'C0180105', 'AC EMU DHC 3PH', 12, 0, 1, 13),
(14, 'C0070101', 'DETC US', 8, 0, 1, 14),
(15, 'C0060103', 'KM DMC 3PH MEDHA', 5, 0, 1, 15),
(16, 'C0060102', 'KM DTC 3PH MEDHA', 5, 0, 1, 16),
(17, 'C0060101', 'KM TC 3 PH MEDHA', 5, 0, 1, 17),
(18, 'C0100801', 'SL DMU DPC', 11, 0, 1, 18),
(19, 'C0100813', 'SL DMU CB AC', 11, 0, 1, 19),
(20, 'C0100805', 'SL DMU TCG AC', 11, 0, 1, 20),
(21, 'C0100806', 'SL FAC', 11, 0, 1, 21),
(22, 'C0100807', 'SL PLR', 11, 0, 1, 22),
(23, 'C0100808', 'SL SCZ', 11, 0, 1, 23),
(24, 'C0100809', 'SL SLR', 11, 0, 1, 24),
(25, 'C0100810', 'SL TC', 11, 0, 1, 25),
(26, 'C0100811', 'SL TCB', 11, 0, 1, 26),
(27, 'C0100812', 'SL TLR', 11, 0, 1, 27),
(28, 'C0130103', 'LDSLR', 2, 1, 1, 28),
(29, 'C0130104', 'LSLRD without DA set', 2, 1, 1, 29),
(30, 'C0110304', 'LRA', 2, 1, 1, 30),
(31, 'C0110302', 'LRAAC', 1, 1, 1, 31),
(32, 'C0120203', 'LS Deena Dayalu', 1, 1, 1, 32),
(33, 'C0110505', 'LWACCNE Garib Rath', 1, 1, 1, 33),
(34, 'C0110104', 'LWCTZAC (Vistadome)', 1, 1, 1, 34),
(35, 'C0110504', 'LWFCWAC', 1, 1, 1, 35),
(36, 'C0110101', 'LWFCZAC', 1, 1, 1, 36),
(37, 'C0120101', 'LWSCZ', 2, 1, 1, 37),
(38, 'C0110103', 'LWSCZ AC', 1, 1, 1, 38),
(39, 'C0050101', 'MEMU DMC 3PH OB', 4, 0, 1, 39),
(40, 'C0050102', 'MEMU DMC 3PH US', 4, 0, 1, 40),
(41, 'C0050103', 'MEMU TC 3PH OB', 4, 0, 1, 41),
(42, 'C0050104', 'MEMU TC 3PH US', 4, 0, 1, 42),
(43, 'C0110303', 'Mobile Trainning Car', 1, 1, 1, 43),
(44, 'C0210208', 'MG NMR FCZ', 10, 0, 1, 44),
(45, 'C0210210', 'MG NMR SLR', 10, 0, 1, 45),
(46, 'C0210209', 'MG NMR SCZ', 10, 0, 1, 46),
(47, 'C0210206', 'Oscillograph Car(RDSO)', 1, 1, 1, 47),
(48, 'C0080101', 'SPART DPC1(SV)', 7, 0, 1, 48),
(49, 'C0080102', 'SPART DPC2(ARTV)', 7, 0, 1, 49),
(50, 'C0080103', 'SPART TC(ARMV)', 7, 0, 1, 50),
(51, 'C0070201', 'SPIC', 9, 0, 1, 51),
(52, 'C0090102', 'TRAIN 18 MC', 6, 0, 1, 52),
(53, 'C0090101', 'TRAIN 18 DTC', 6, 0, 1, 53),
(54, 'C0090104', 'TRAIN 18 TC', 6, 0, 1, 54),
(55, 'C0100814', 'SL PBV', 11, 0, 1, 55),
(56, 'C0040114', 'AC EMU B MMTS', 3, 0, 1, 56),
(57, 'C0040105', '3PH AC EMU MC MEDHA', 3, 0, 1, 57),
(58, 'C0040112', 'AC EMU D MMTS', 3, 0, 1, 58),
(59, 'C0040108', '3PH AC EMU TC US MEDHA', 3, 0, 1, 59),
(60, 'C0040110', 'AC EMU M 3PH', 3, 0, 1, 60),
(61, 'C0040103', '3PH AC EMU DMC US MEDHA', 3, 0, 1, 61),
(62, 'C0040106', '3PH AC EMU NDMC US MEDHA', 3, 0, 1, 62),
(63, 'C0040113', 'AC EMU DHC', 3, 0, 1, 63),
(64, 'C0040115', '3PH AC EMU DMC OB MEDHA', 3, 0, 1, 64),
(65, 'C0040116', '3PH AC EMU NDMC OB MEDHA', 3, 0, 1, 65),
(66, 'C0040117', '3PH AC EMU TC OB MEDHA', 3, 0, 1, 66),
(67, 'C0040201', '3PH EMU B BHEL', 3, 0, 1, 67),
(68, 'C0040202', '3PH EMU C BHEL', 3, 0, 1, 68),
(69, 'C0040203', '3PH EMU B BT', 3, 0, 1, 69),
(70, 'C0040204', '3PH EMU B HL', 3, 0, 1, 70),
(71, 'C0040205', '3PH EMU C BT', 3, 0, 1, 71),
(72, 'C0040206', '3PH EMU C CIDCO', 3, 0, 1, 72),
(73, 'C0040207', '3PH EMU C HL', 3, 0, 1, 73),
(74, 'C0040208', '3PH EMU C MEDHA', 3, 0, 1, 74),
(75, 'C0040209', '3PH EMU CHC MEDHA', 3, 0, 1, 75),
(76, 'C0040214', '3PH EMU D MEDHA', 3, 0, 1, 76),
(77, 'C0040215', '3PH EMU B MUTP', 3, 0, 1, 77),
(78, 'C0040216', '3PH EMU C MUTP', 3, 0, 1, 78),
(79, 'C0040217', '3PH EMU D MUTP', 3, 0, 1, 79),
(80, 'C0040218', '3PH EMU DHC MUTP', 3, 0, 1, 80),
(81, 'C0040219', '3PH EMU B CIDCO', 3, 0, 1, 81),
(82, 'C0040220', '3PH EMU B MEDHA', 3, 0, 1, 82),
(83, 'C0040221', '3PH EMU D BT', 3, 0, 1, 83),
(84, 'C0040222', '3PH EMU D CIDCO', 3, 0, 1, 84),
(85, 'C0040223', '3PH EMU D HL', 3, 0, 1, 85),
(86, 'C0040224', '3PH EMU D BHEL', 3, 0, 1, 86),
(87, 'C0040225', '3PH EMU DHC BHEL', 3, 0, 1, 87),
(88, 'C0050105', 'MEMU DMC OB BHEL(8 CAR)', 4, 0, 1, 88),
(89, 'C0050106', 'MEMU TC OB BHEL(8 CAR)', 4, 0, 1, 89),
(90, 'C0050107', 'MEMU DMC OB MEDHA(12 CAR)', 4, 0, 1, 90),
(91, 'C0050108', 'MEMU NDMC OB MEDHA(12 CAR)', 4, 0, 1, 91),
(92, 'C0050109', 'MEMU TC OB MEDHA(12 CAR)', 4, 0, 1, 92),
(93, 'C0050110', 'MEMU DMC OB JK (12 CAR)', 4, 0, 1, 93),
(94, 'C0050111', 'MEMU NDMC OB JK (12 CAR)', 4, 0, 1, 94),
(95, 'C0050112', 'MEMU TC OB JK (12 CAR)', 4, 0, 1, 95),
(96, 'C0060104', 'KM DTC 3PH ZHUZHOU', 5, 0, 1, 96),
(97, 'C0060105', 'KM MC 3PH ZHUZHOU', 5, 0, 1, 97),
(98, 'C0060106', 'KM TC 3PH ZHUZHOU', 5, 0, 1, 98),
(99, 'C0060107', 'MAHA-METRO TC', 5, 0, 1, 99),
(100, 'C0060108', 'MAHA-METRO DTC', 5, 0, 1, 100),
(101, 'C0060109', 'MAHA-METRO MC EC', 5, 0, 1, 101),
(102, 'C0060110', 'MAHA-METRO MC', 5, 0, 1, 102),
(103, 'C0060111', 'KM TC RVNL', 5, 0, 1, 103),
(104, 'C0060112', 'KM MC RVNL', 5, 0, 1, 104),
(105, 'C0060113', 'KM DTC RVNL', 5, 0, 1, 105),
(106, 'C0090103', 'TRAIN 18 NDTC', 6, 0, 1, 106),
(107, 'C0090105', 'HERITAGE TS DTC', 6, 0, 1, 107),
(108, 'C0090106', 'HERITAGE TS MC', 6, 0, 1, 108),
(109, 'C0090107', 'HERITAGE TS TC', 6, 0, 1, 109),
(110, 'C0900108', 'HERITAGE TS MC EXH', 6, 0, 1, 110),
(111, 'C0090109', 'HERITAGE TS TC CBD', 6, 0, 1, 111),
(112, 'C0090110', 'HERITAGE TS MC EX', 6, 0, 1, 112),
(113, 'C0090111', 'Vande Bharat MC(8 car)', 6, 0, 1, 113),
(114, 'C0090112', 'Vande Bharat DTC(8 car)', 6, 0, 1, 114),
(115, 'C0090113', 'Vande Bharat TC EC(8 car)', 6, 0, 1, 115),
(116, 'C0090114', 'Vande Bharat TC (8 car)', 6, 0, 1, 116),
(117, 'C0090115', 'VB Sleeper MC (16 Car) BEML', 6, 0, 1, 117),
(118, 'C0090116', 'VB Sleeper DTC (16 Car) BEML', 6, 0, 1, 118),
(119, 'C0090117', 'VB Sleeper NDTC (16 Car) BEML', 6, 0, 1, 119),
(120, 'C0090118', 'VB Sleeper TC (16 Car) BEML', 6, 0, 1, 120),
(121, 'C0090119', 'VANDE METRO DTC', 6, 0, 1, 121),
(122, 'C0090120', 'VANDE METRO NDMC', 6, 0, 1, 122),
(123, 'C0090121', 'VANDE METRO TC', 6, 0, 1, 123),
(124, 'C0090122', 'Treasury Van (BNP)', 6, 0, 1, 124),
(125, 'C0090123', 'VANDE METRO MC', 6, 0, 1, 125),
(126, 'C0090127', 'Vande Bharat DTC(20 car)', 6, 0, 1, 126),
(127, 'C0090128', 'Vande Bharat MC(20 car)', 6, 0, 1, 127),
(128, 'C0090129', 'Vande Bharat NDTC(20 car)', 6, 0, 1, 128),
(129, 'C0090126', 'Vande Bharat TC(20 car)', 6, 0, 1, 129),
(130, 'C0070202', 'SPIC AC for DFCCIL', 9, 0, 1, 130),
(131, 'C0070301', 'Office on Wheel', 9, 0, 1, 131),
(132, 'C0120201', 'LWS AC', 2, 1, 1, 132),
(133, 'C0120301', 'VP/Parcel Vn/LHB', 2, 1, 1, 133),
(134, 'C0130106', 'LWSCN (PUSH-PULL)', 2, 1, 1, 134),
(135, 'C0130107', 'LWS (PUSH-PULL)', 2, 1, 1, 135),
(136, 'C0130109', 'LSLRD (PUSH-PULL) 1.0', 2, 1, 1, 136),
(137, 'C0130108', 'LSLRD(PUSH-PULL) 2.0', 2, 1, 1, 137),
(138, 'C0210211', 'FREIGHT EMU MC', 12, 0, 1, 138),
(139, 'C0210212', 'FREIGHT EMU DTC', 12, 0, 1, 139),
(140, 'C0210213', 'FREIGHT EMU NDTC', 12, 0, 1, 140),
(141, 'C0210214', 'FREIGHT EMU TC', 12, 0, 1, 141),
(142, 'C0210215', 'Office on Wheels VB', 12, 0, 1, 142),
(143, 'C0130105', 'LWLRRM( BV Garib Rath)', 1, 1, 1, 143),
(144, 'C0130113', 'LSLRD (PUSH-PULL) 2.0', 2, 1, 1, 144),
(145, 'C0130117', 'LVPH', 2, 1, 1, 145),
(146, 'C0130111', 'LWS (PUSH-PULL) 2.0', 2, 1, 1, 146),
(147, 'C0110403', 'LWCB (PUSH-PULL) 2.0', 1, 1, 1, 147),
(148, 'C0120502', 'LWSCN-RCF', 2, 1, 1, 148),
(149, 'C0110510', 'LWACCW PP 3.0', 1, 1, 1, 149),
(150, 'C0110513', 'LWS PP 3.0', 1, 1, 1, 150),
(151, 'C0130102', 'LWS-RCF', 1, 1, 1, 151),
(152, 'C0110514', 'LWFAC PP 3.0', 1, 1, 1, 152),
(153, 'C0110515', 'LWACCN PP 3.0', 1, 1, 1, 153),
(154, 'C0110516', 'LWCBAC PP 3.0', 1, 1, 1, 154),
(155, 'C0130114', 'LWSCN (PUSH-PULL) 2.0', 2, 1, 1, 155),
(156, 'C0110511', 'LSLRD PP 3.0', 1, 1, 1, 156),
(157, 'C0040119', 'EMU -B 3PH MEDHA(15 CAR)', 3, 0, 1, 157),
(158, 'C0040120', 'EMU -C 3PH MEDHA(15 CAR)', 3, 0, 1, 158),
(159, 'C0040121', 'EMU -D 3PH MEDHA(15 CAR)', 3, 0, 1, 159),
(160, 'C0040122', 'EMU -CHC 3PH MEDHA(15 CAR)', 3, 0, 1, 160),
(161, 'C0070203', 'SPMMC SPIC-KAVACH', 9, 0, 1, 161),
(162, 'C0130118', 'LWLRRM PP 3.0', 2, 1, 1, 162),
(163, 'C0040127', 'EMU - B 3PH Titagarh', 3, 0, 1, 163),
(164, 'C0040128', 'EMU - C 3PH Titagarh', 3, 0, 1, 164),
(165, 'C0040130', 'EMU - CHC/DHC 3PH Titagarh', 3, 0, 1, 165),
(166, 'C0040129', 'EMU - D 3PH Titagarh', 3, 0, 1, 166),
(167, 'C0220101', 'Non AC MBU for 12 car Conversion', 13, 0, 1, 167),
(168, 'C0040111', 'EMU -C 3PH', 3, 0, 1, 168),
(169, 'C0090137', 'Vande Bharat MC CC', 6, 0, 1, 169),
(170, 'C0090138', 'Vande Bharat DTC CC', 6, 0, 1, 170),
(171, 'C0090139', 'Vande Bharat NDTC CC', 6, 0, 1, 171),
(172, 'C0090140', 'Vande Bharat TC CC', 6, 0, 1, 172),
(173, 'C0090141', 'Vande Bharat MC (24 Car)', 6, 0, 1, 173),
(174, 'C0090142', 'Vande Bharat DTC (24 Car)', 6, 0, 1, 174),
(175, 'C0090143', 'Vande Bharat NDTC (24 Car)', 6, 0, 1, 175),
(176, 'C0090144', 'Vande Bharat TC (24 Car)', 6, 0, 1, 176),
(177, 'C0230101', 'NMR Coaches', 13, 0, 1, 177),
(178, 'C0040133', 'MEMU 121 CAR (CGPICL)', 3, 0, 1, 178),
(179, 'C0040131', 'AC EMU 15 CAR MUMBAI REGION', 3, 0, 1, 179),
(180, 'C0040132', 'AC EMU 12 CAR OTHER REGION', 3, 0, 1, 180),
(181, 'C0110512', 'LWSCN PP 3.0', 1, 1, 1, 181);

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
-- Admin-configured static day-counts (not predicted), one row per coach
-- type, used by every stage worklist to compute a Predicted Date (see
-- backend/lib/Schedule.php). Real values imported from ICF's legacy
-- `tbl_coach_schedule` export — shell_to_furnishing_days is 1 for every
-- coach type in that source (previously treated as always 0 in this
-- project; that rule was replaced by the real data per admin instruction).
-- coach_type_id 7 (LSLRD) has no exact-name match in the source file and
-- still carries the old placeholder row (see coach_types comment above).

INSERT INTO fixed_schedules
  (coach_type_id, shell_to_furnishing_days, furnishing_to_paint_in_days, paint_in_to_paint_out_days,
   paint_out_to_assembly_in_days, assembly_in_to_assembly_out_days, assembly_out_to_local_outturn_days,
   local_outturn_to_dispatch_days, target_total_days)
VALUES
(1, 1, 1, 4, 1, 10, 1, 1, 19),
(2, 1, 1, 4, 1, 15, 1, 1, 24),
(3, 1, 1, 4, 1, 13, 1, 1, 22),
(4, 1, 1, 4, 1, 13, 1, 1, 22),
(5, 1, 1, 4, 1, 15, 1, 1, 24),
(6, 1, 1, 4, 1, 7, 1, 1, 16),
(7, 0, 1, 4, 1, 20, 1, 1, 28),
(8, 1, 1, 4, 1, 20, 1, 1, 29),
(9, 1, 1, 4, 1, 15, 1, 1, 24),
(10, 1, 1, 4, 1, 15, 1, 1, 24),
(11, 1, 1, 4, 1, 15, 1, 1, 24),
(12, 1, 1, 4, 1, 15, 1, 1, 24),
(13, 1, 1, 4, 1, 15, 1, 1, 24),
(14, 1, 1, 4, 1, 17, 1, 1, 26),
(15, 1, 1, 4, 1, 30, 1, 1, 39),
(16, 1, 1, 4, 1, 30, 1, 1, 39),
(17, 1, 1, 4, 1, 30, 1, 1, 39),
(18, 1, 1, 4, 1, 21, 1, 1, 30),
(19, 1, 1, 4, 1, 14, 1, 1, 23),
(20, 1, 1, 4, 1, 12, 1, 1, 21),
(21, 1, 1, 5, 1, 20, 1, 1, 30),
(22, 1, 1, 5, 1, 20, 1, 1, 30),
(23, 1, 1, 5, 1, 19, 1, 1, 29),
(24, 1, 1, 5, 1, 20, 1, 1, 30),
(25, 1, 1, 5, 1, 19, 1, 1, 29),
(26, 1, 1, 5, 1, 19, 1, 1, 29),
(27, 1, 1, 5, 1, 19, 1, 1, 29),
(28, 1, 1, 4, 1, 15, 1, 1, 24),
(29, 1, 1, 4, 1, 14, 1, 1, 23),
(30, 1, 1, 4, 1, 10, 1, 1, 19),
(31, 1, 1, 4, 1, 13, 1, 1, 22),
(32, 1, 1, 4, 1, 7, 1, 1, 16),
(33, 1, 1, 4, 1, 14, 1, 1, 23),
(34, 1, 1, 4, 1, 25, 1, 1, 34),
(35, 1, 1, 4, 1, 15, 1, 1, 24),
(36, 1, 1, 4, 1, 12, 1, 1, 21),
(37, 1, 1, 4, 1, 7, 1, 1, 16),
(38, 1, 1, 4, 1, 12, 1, 1, 21),
(39, 1, 1, 4, 1, 16, 1, 1, 25),
(40, 1, 1, 4, 1, 16, 1, 1, 25),
(41, 1, 1, 4, 1, 9, 1, 1, 18),
(42, 1, 1, 4, 1, 9, 1, 1, 18),
(43, 1, 1, 4, 1, 13, 1, 1, 22),
(44, 1, 1, 4, 1, 11, 1, 1, 20),
(45, 1, 1, 4, 1, 11, 1, 1, 20),
(46, 1, 1, 4, 1, 11, 1, 1, 20),
(47, 1, 1, 4, 1, 18, 1, 1, 27),
(48, 1, 1, 4, 1, 26, 1, 1, 35),
(49, 1, 1, 4, 1, 26, 1, 1, 35),
(50, 1, 1, 4, 1, 25, 1, 1, 34),
(51, 1, 1, 4, 1, 17, 1, 1, 26),
(52, 1, 1, 4, 1, 25, 1, 1, 34),
(53, 1, 1, 4, 1, 25, 1, 1, 34),
(54, 1, 1, 4, 1, 25, 1, 1, 34),
(55, 1, 1, 5, 1, 19, 1, 1, 29),
(56, 1, 1, 4, 1, 15, 1, 1, 24),
(57, 1, 1, 4, 1, 15, 1, 1, 24),
(58, 1, 1, 4, 1, 15, 1, 1, 24),
(59, 1, 1, 4, 1, 15, 1, 1, 24),
(60, 1, 1, 4, 1, 15, 1, 1, 24),
(61, 1, 1, 4, 1, 15, 1, 1, 24),
(62, 1, 1, 4, 1, 15, 1, 1, 24),
(63, 1, 1, 4, 1, 15, 1, 1, 24),
(64, 1, 1, 4, 1, 15, 1, 1, 24),
(65, 1, 1, 4, 1, 15, 1, 1, 24),
(66, 1, 1, 4, 1, 15, 1, 1, 24),
(67, 1, 1, 4, 1, 15, 1, 1, 24),
(68, 1, 1, 4, 1, 15, 1, 1, 24),
(69, 1, 1, 4, 1, 15, 1, 1, 24),
(70, 1, 1, 4, 1, 15, 1, 1, 24),
(71, 1, 1, 4, 1, 15, 1, 1, 24),
(72, 1, 1, 4, 1, 15, 1, 1, 24),
(73, 1, 1, 4, 1, 15, 1, 1, 24),
(74, 1, 1, 4, 1, 15, 1, 1, 24),
(75, 1, 1, 4, 1, 15, 1, 1, 24),
(76, 1, 1, 4, 1, 15, 1, 1, 24),
(77, 1, 1, 4, 1, 15, 1, 1, 24),
(78, 1, 1, 4, 1, 15, 1, 1, 24),
(79, 1, 1, 4, 1, 15, 1, 1, 24),
(80, 1, 1, 4, 1, 15, 1, 1, 24),
(81, 1, 1, 4, 1, 15, 1, 1, 24),
(82, 1, 1, 4, 1, 15, 1, 1, 24),
(83, 1, 1, 4, 1, 15, 1, 1, 24),
(84, 1, 1, 4, 1, 15, 1, 1, 24),
(85, 1, 1, 4, 1, 15, 1, 1, 24),
(86, 1, 1, 4, 1, 15, 1, 1, 24),
(87, 1, 1, 4, 1, 15, 1, 1, 24),
(88, 1, 1, 4, 1, 9, 1, 1, 18),
(89, 1, 1, 4, 1, 9, 1, 1, 18),
(90, 1, 1, 4, 1, 9, 1, 1, 18),
(91, 1, 1, 4, 1, 9, 1, 1, 18),
(92, 1, 1, 4, 1, 9, 1, 1, 18),
(93, 1, 1, 4, 1, 9, 1, 1, 18),
(94, 1, 1, 4, 1, 9, 1, 1, 18),
(95, 1, 1, 4, 1, 9, 1, 1, 18),
(96, 1, 1, 4, 1, 30, 1, 1, 39),
(97, 1, 1, 4, 1, 30, 1, 1, 39),
(98, 1, 1, 4, 1, 30, 1, 1, 39),
(99, 1, 1, 4, 1, 30, 1, 1, 39),
(100, 1, 1, 4, 1, 30, 1, 1, 39),
(101, 1, 1, 4, 1, 30, 1, 1, 39),
(102, 1, 1, 4, 1, 30, 1, 1, 39),
(103, 1, 1, 4, 1, 30, 1, 1, 39),
(104, 1, 1, 4, 1, 30, 1, 1, 39),
(105, 1, 1, 4, 1, 30, 1, 1, 39),
(106, 1, 1, 4, 1, 25, 1, 1, 34),
(107, 1, 1, 4, 1, 25, 1, 1, 34),
(108, 1, 1, 4, 1, 25, 1, 1, 34),
(109, 1, 1, 4, 1, 25, 1, 1, 34),
(110, 1, 1, 4, 1, 25, 1, 1, 34),
(111, 1, 1, 4, 1, 25, 1, 1, 34),
(112, 1, 1, 4, 1, 25, 1, 1, 34),
(113, 1, 1, 4, 1, 25, 1, 1, 34),
(114, 1, 1, 4, 1, 25, 1, 1, 34),
(115, 1, 1, 4, 1, 25, 1, 1, 34),
(116, 1, 1, 4, 1, 25, 1, 1, 34),
(117, 1, 1, 4, 1, 25, 1, 1, 34),
(118, 1, 1, 4, 1, 25, 1, 1, 34),
(119, 1, 1, 4, 1, 25, 1, 1, 34),
(120, 1, 1, 4, 1, 25, 1, 1, 34),
(121, 1, 1, 4, 1, 25, 1, 1, 34),
(122, 1, 1, 4, 1, 25, 1, 1, 34),
(123, 1, 1, 4, 1, 25, 1, 1, 34),
(124, 1, 1, 4, 1, 25, 1, 1, 34),
(125, 1, 1, 4, 1, 25, 1, 1, 34),
(126, 1, 1, 4, 1, 25, 1, 1, 34),
(127, 1, 1, 4, 1, 25, 1, 1, 34),
(128, 1, 1, 4, 1, 25, 1, 1, 34),
(129, 1, 1, 4, 1, 25, 1, 1, 34),
(130, 1, 1, 4, 1, 17, 1, 1, 26),
(131, 1, 1, 4, 1, 17, 1, 1, 26),
(132, 1, 1, 4, 1, 10, 1, 1, 19),
(133, 1, 1, 4, 1, 10, 1, 1, 19),
(134, 1, 1, 4, 1, 10, 1, 1, 19),
(135, 1, 1, 4, 1, 10, 1, 1, 19),
(136, 1, 1, 4, 1, 10, 1, 1, 19),
(137, 1, 1, 4, 1, 10, 1, 1, 19),
(138, 1, 1, 4, 1, 15, 1, 1, 24),
(139, 1, 1, 4, 1, 15, 1, 1, 24),
(140, 1, 1, 4, 1, 15, 1, 1, 24),
(141, 1, 1, 4, 1, 15, 1, 1, 24),
(142, 1, 1, 4, 1, 15, 1, 1, 24),
(143, 1, 1, 4, 1, 10, 1, 1, 19),
(144, 1, 1, 4, 1, 10, 1, 1, 19),
(145, 1, 1, 4, 1, 10, 1, 1, 19),
(146, 1, 1, 4, 1, 10, 1, 1, 19),
(147, 1, 1, 4, 1, 15, 1, 1, 24),
(148, 1, 1, 4, 1, 7, 1, 1, 16),
(149, 1, 1, 4, 1, 15, 1, 1, 24),
(150, 1, 1, 4, 1, 15, 1, 1, 24),
(151, 1, 1, 4, 1, 7, 1, 1, 16),
(152, 1, 1, 4, 1, 15, 1, 1, 24),
(153, 1, 1, 4, 1, 15, 1, 1, 24),
(154, 1, 1, 4, 1, 15, 1, 1, 24),
(155, 1, 1, 4, 1, 10, 1, 1, 19),
(156, 1, 1, 4, 1, 15, 1, 1, 24),
(157, 1, 1, 4, 1, 15, 1, 1, 24),
(158, 1, 1, 4, 1, 15, 1, 1, 24),
(159, 1, 1, 4, 1, 15, 1, 1, 24),
(160, 1, 1, 4, 1, 15, 1, 1, 24),
(161, 1, 1, 4, 1, 17, 1, 1, 26),
(162, 1, 1, 4, 1, 10, 1, 1, 19),
(163, 1, 1, 4, 1, 15, 1, 1, 24),
(164, 1, 1, 4, 1, 15, 1, 1, 24),
(165, 1, 1, 4, 1, 15, 1, 1, 24),
(166, 1, 1, 4, 1, 15, 1, 1, 24),
(167, 1, 1, 4, 1, 15, 1, 1, 24),
(168, 1, 1, 4, 1, 15, 1, 1, 24),
(169, 1, 1, 4, 1, 25, 1, 1, 34),
(170, 1, 1, 4, 1, 25, 1, 1, 34),
(171, 1, 1, 4, 1, 25, 1, 1, 34),
(172, 1, 1, 4, 1, 25, 1, 1, 34),
(173, 1, 1, 4, 1, 25, 1, 1, 34),
(174, 1, 1, 4, 1, 25, 1, 1, 34),
(175, 1, 1, 4, 1, 25, 1, 1, 34),
(176, 1, 1, 4, 1, 25, 1, 1, 34),
(177, 1, 1, 4, 1, 15, 1, 1, 24),
(178, 1, 1, 4, 1, 15, 1, 1, 24),
(179, 1, 1, 4, 1, 15, 1, 1, 24),
(180, 1, 1, 4, 1, 15, 1, 1, 24),
(181, 1, 1, 4, 1, 15, 1, 1, 24);

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

-- The 32 Assembly Operations a coach passes through between Assembly In and
-- Assembly Out (department codes EP/MP/MI/EI). Display names are derived
-- from the machine code (strip "tcp_" prefix, underscores -> spaces, Title
-- Case) — not hand-authored, so a couple read a bit raw (e.g. "R00000001").
INSERT INTO assembly_operations (id, code, department, sort_order, display_name) VALUES
(1, 'tcp_roof_clearance', 'EP', 1, 'Roof Clearance'),
(2, 'tcp_sbc_loading', 'EP', 2, 'Sbc Loading'),
(3, 'tcp_partition_clearance', 'EP', 3, 'Partition Clearance'),
(4, 'tcp_ducting', 'MP', 4, 'Ducting'),
(5, 'tcp_modular_toilet_loading', 'MP', 5, 'Modular Toilet Loading'),
(6, 'tcp_rmpu_loading', 'EP', 6, 'Rmpu Loading'),
(7, 'tcp_partition', 'MP', 7, 'Partition'),
(8, 'tcp_side_panel_fixing', 'MP', 8, 'Side Panel Fixing'),
(9, 'tcp_ceiling_fixing', 'MP', 9, 'Ceiling Fixing'),
(10, 'tcp_aux_water_tank', 'MP', 10, 'Aux Water Tank'),
(11, 'tcp_seats_berths', 'MI', 11, 'Seats Berths'),
(12, 'tcp_papis', 'MP', 12, 'Papis'),
(13, 'tcp_fire_alterter', 'MP', 13, 'Fire Alterter'),
(14, 'tcp_trough_clearance', 'MP', 14, 'Trough Clearance'),
(15, 'tcp_mech_ac_offering_target', 'MP', 15, 'Mech Ac Offering Target'),
(16, 'tcp_mech_ac_offering_completed', 'MP', 16, 'Mech Ac Offering Completed'),
(17, 'tcp_electrical_hv_offering', 'EP', 17, 'Electrical Hv Offering'),
(18, 'tcp_electrical_ac_offering', 'EP', 18, 'Electrical Ac Offering'),
(19, 'tcp_electrical_ac_sequence_offering', 'EP', 19, 'Electrical Ac Sequence Offering'),
(20, 'tcp_elec_hv_clearance', 'EI', 20, 'Elec Hv Clearance'),
(21, 'tcp_elec_ac_clearance', 'EI', 21, 'Elec Ac Clearance'),
(22, 'tcp_ac_seq_electrical_clearance', 'EI', 22, 'Ac Seq Electrical Clearance'),
(23, 'tcp_mech_final_offering', 'MP', 23, 'Mech Final Offering'),
(24, 'tcp_R00000001', 'MP', 24, 'R00000001'),
(25, 'tcp_water_leak_clearance', 'MI', 25, 'Water Leak Clearance'),
(26, 'tcp_brake_clearance', 'MI', 26, 'Brake Clearance'),
(27, 'tcp_internal_clearance', 'MI', 27, 'Internal Clearance'),
(28, 'tcp_fire_alarm_clearance', 'MI', 28, 'Fire Alarm Clearance'),
(29, 'tcp_lock_seal', 'MP', 29, 'Lock Seal'),
(30, 'tcp_inspection_clearance', 'MP', 30, 'Inspection Clearance'),
(31, 'tcp_Pitline_clearance_insp', 'MP', 31, 'Pitline Clearance Insp'),
(32, 'tcp_final_paint_clearance', 'MI', 32, 'Final Paint Clearance');

-- One skill per Assembly Operation — this is how Assembly Admin assigns
-- operations to a worker (at creation or via Edit Skills), reusing the same
-- skills/user_skills mechanism as Furnishing/Outturn-Dispatch above instead
-- of a bespoke assignment table. Split by department: EP/MP operations go
-- to ASSEMBLY_OPERATION; MI operations to the existing (previously unused)
-- MECHANICAL_INSPECTION role; EI operations to ELECTRICAL_INSPECTION.
-- coach_category_id is required by the schema but unused for these roles —
-- pinned to LHB AC.
INSERT INTO skills (id, name, operation, role_code, coach_category_id)
SELECT id + 100, display_name, code,
       CASE department
         WHEN 'MI' THEN 'MECHANICAL_INSPECTION'
         WHEN 'EI' THEN 'ELECTRICAL_INSPECTION'
         ELSE 'ASSEMBLY_OPERATION'
       END,
       1
FROM assembly_operations
ORDER BY sort_order;

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
