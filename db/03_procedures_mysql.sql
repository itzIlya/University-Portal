USE university;
DELIMITER //

-- ── enroll_student ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS enroll_student//
CREATE PROCEDURE enroll_student (
    IN p_student_id  INT,
    IN p_section_id  INT
)
BEGIN
    DECLARE v_capacity INT;
    DECLARE v_current  INT;

    -- capacity lookup
    SELECT capacity INTO v_capacity
      FROM section WHERE section_id = p_section_id;

    IF v_capacity IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Section does not exist';
    END IF;

    SELECT COUNT(*) INTO v_current
      FROM enrollment WHERE section_id = p_section_id;

    IF v_current >= v_capacity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Section is full';
    END IF;

    INSERT INTO enrollment(student_id, section_id)
    VALUES (p_student_id, p_section_id)
    ON DUPLICATE KEY UPDATE enrolled_at = enrolled_at;  -- idempotent no‑op
END//

-- ── get_transcript ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS get_transcript//
CREATE PROCEDURE get_transcript (
    IN p_student_id INT
)
BEGIN
    SELECT c.code AS course_code,
           s.term,
           e.grade
    FROM enrollment e
    JOIN section s ON s.section_id = e.section_id
    JOIN course  c ON c.course_id  = s.course_id
    WHERE e.student_id = p_student_id
    ORDER BY s.term, c.code;
END//


/*───────────────────────────────────────────────────────────────
  register_student.sql   – create / replace procedure
───────────────────────────────────────────────────────────────*/

DROP PROCEDURE IF EXISTS register_student//
CREATE PROCEDURE register_student (
    IN  p_national_id  CHAR(20),
    IN  p_major_name   VARCHAR(150)
)
BEGIN
    -- --------------------------------------------------------------
    -- DECLAREs first
    -- --------------------------------------------------------------
    DECLARE v_mid        CHAR(36);
    DECLARE v_major_id   CHAR(36);
    DECLARE v_record_id  CHAR(36);
    DECLARE v_active_sem CHAR(36);

    -- --------------------------------------------------------------
    -- 1. resolve member
    -- --------------------------------------------------------------
    SELECT mid
      INTO v_mid
      FROM members
     WHERE national_id = p_national_id
     LIMIT 1;

    IF v_mid IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No member with that national_id';
    END IF;

    -- --------------------------------------------------------------
    -- 2. resolve major
    -- --------------------------------------------------------------
    SELECT major_id
      INTO v_major_id
      FROM majors
     WHERE major_name = p_major_name
     LIMIT 1;

    IF v_major_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No such major';
    END IF;

    -- --------------------------------------------------------------
    -- 3. duplicate check  (mid, major) unique
    -- --------------------------------------------------------------
    IF EXISTS (
        SELECT 1 FROM std_records
         WHERE mid = v_mid AND major_id = v_major_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Student already registered for this major';
    END IF;

    -- --------------------------------------------------------------
    -- 4. find the active semester (latest by start_date)
    -- --------------------------------------------------------------
    SELECT sid
      INTO v_active_sem
      FROM semesters
     WHERE is_active = TRUE
     ORDER BY start_date DESC
     LIMIT 1;

    IF v_active_sem IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No active semester defined';
    END IF;

    -- - -------------------------------------------------------------
    -- 5. insert std_record with entrance_sem
    -- --------------------------------------------------------------
    INSERT INTO std_records (mid, major_id, entrance_sem)
    VALUES (v_mid, v_major_id, v_active_sem);

    -- -------------------------------------------------------------
    -- 6. return the new record_id
    -- --------------------------------------------------------------
    SELECT record_id
      INTO v_record_id
      FROM std_records
     WHERE mid = v_mid AND major_id = v_major_id
     LIMIT 1;

    SELECT v_record_id AS record_id, v_active_sem AS entrance_sem;
END//



/*───────────────────────────────────────────────────────────────
  add_member_with_credentials.sql
───────────────────────────────────────────────────────────────*/

DROP PROCEDURE IF EXISTS add_member_with_credentials//
CREATE PROCEDURE add_member_with_credentials (
    IN  p_is_admin      BOOLEAN,        -- caller can still force TRUE/FALSE
    IN  p_fname         VARCHAR(100),
    IN  p_lname         VARCHAR(100),
    IN  p_national_id   CHAR(20),
    IN  p_birthday      DATE,
    IN  p_username      VARCHAR(150),
    IN  p_password_hash VARCHAR(256)
)
BEGIN
    DECLARE v_mid       CHAR(36) DEFAULT (UUID());
    DECLARE v_total     INT;

    /*── 0. Uniqueness guards ───────────────────────────────────────────*/
    IF EXISTS (SELECT 1 FROM members WHERE national_id = p_national_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'national_id already exists';
    END IF;

    IF EXISTS (SELECT 1 FROM credentials WHERE username = p_username) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'username already taken';
    END IF;

    /*── 1. First‑member‑wins admin flag ────────────────────────────────*/
    SELECT COUNT(*) INTO v_total FROM members;
    IF v_total = 0 THEN
        SET p_is_admin = TRUE;   -- override caller value
    END IF;

    /*── 2. Insert into member ──────────────────────────────────────────*/
    INSERT INTO members(mid, is_admin, fname, lname, national_id, birthday)
    VALUES (v_mid, p_is_admin, p_fname, p_lname, p_national_id, p_birthday);

    /*── 3. Insert credentials ─────────────────────────────────────────*/
    INSERT INTO credentials(member_id, username, password_hash)
    VALUES (v_mid, p_username, p_password_hash);

    /*── 4. Return member_id ───────────────────────────────────────────*/
    SELECT v_mid AS member_id, p_is_admin AS is_admin;
END//



/*───────────────────────────────────────────────────────────────
  1. add_semester  – insert + optional activate
───────────────────────────────────────────────────────────────*/
DROP PROCEDURE IF EXISTS add_semester//
CREATE PROCEDURE add_semester (
    IN p_start_date DATE,
    IN p_end_date   DATE,
    IN p_sem_title  VARCHAR(30),
    IN p_set_active BOOLEAN        -- TRUE → make this the active semester
)
BEGIN
    DECLARE v_sid CHAR(36) DEFAULT (UUID());

    /*── basic validations ─────────────────────────────────────*/
    IF p_start_date >= p_end_date THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'start_date must be before end_date';
    END IF;

    IF EXISTS (SELECT 1 FROM semesters WHERE sem_title = p_sem_title) THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'sem_title already exists';
    END IF;

    /*── ensure single active row ──────────────────────────────*/
    IF p_set_active THEN
        UPDATE semesters SET is_active = FALSE WHERE is_active = TRUE;
    END IF;

    /*── insert the new semester ───────────────────────────────*/
    INSERT INTO semesters
          (sid, start_date, end_date, sem_title, is_active)
    VALUES (v_sid, p_start_date, p_end_date, p_sem_title, p_set_active);

    /*── return the new UUID so the caller can use it ──────────*/
    SELECT v_sid AS sid;
END//

/*───────────────────────────────────────────────────────────────
  2. activate_semester  – flip one row to active
───────────────────────────────────────────────────────────────*/
DROP PROCEDURE IF EXISTS activate_semester//
CREATE PROCEDURE activate_semester (
    IN p_sid CHAR(36)      -- UUID of the semester to activate
)
BEGIN
    /*── confirm it exists ─────────────────────────────────────*/
    IF NOT EXISTS (SELECT 1 FROM semesters WHERE sid = p_sid) THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'semester not found';
    END IF;

    /*── flip current active off, new one on ───────────────────*/
    UPDATE semesters SET is_active = FALSE WHERE is_active = TRUE;
    UPDATE semesters SET is_active = TRUE  WHERE sid = p_sid;
END//


/*───────────────────────────────────────────────────────────────
  1. add_department   – create + return did
───────────────────────────────────────────────────────────────*/
DROP PROCEDURE IF EXISTS add_department//
CREATE PROCEDURE add_department (
    IN  p_department_name VARCHAR(150),
    IN  p_location        VARCHAR(200)
)
BEGIN
    DECLARE v_did CHAR(36) DEFAULT (UUID());

    -- unique name guard
    IF EXISTS (SELECT 1 FROM departments WHERE department_name = p_department_name) THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'department_name already exists';
    END IF;

    INSERT INTO departments (did, department_name, location)
    VALUES (v_did, p_department_name, p_location);

    SELECT v_did AS department_id;
END//
/*───────────────────────────────────────────────────────────────
  add_major  – create a major given the department *name*
───────────────────────────────────────────────────────────────*/
DROP PROCEDURE IF EXISTS add_major//
CREATE PROCEDURE add_major (
    IN  p_major_name       VARCHAR(150),
    IN  p_department_name  VARCHAR(150)     -- pass the dept *name*
)
BEGIN

    DECLARE v_major_id CHAR(36) DEFAULT (UUID());
    DECLARE v_did      CHAR(36);


    SELECT did
      INTO v_did
      FROM departments
     WHERE department_name = p_department_name
     LIMIT 1;

    IF v_did IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'department_name not found';
    END IF;


    IF EXISTS (SELECT 1 FROM majors WHERE major_name = p_major_name) THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'major_name already exists';
    END IF;


    INSERT INTO majors (major_id, major_name, did)
    VALUES (v_major_id, p_major_name, v_did);


    SELECT v_major_id AS major_id, v_did AS department_id;
END//
DELIMITER ;
