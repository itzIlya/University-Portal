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

DROP PROCEDURE IF EXISTS register_student;


CREATE PROCEDURE register_student (
    IN  p_national_id  CHAR(20),
    IN  p_major_name   VARCHAR(150)
)
BEGIN
    DECLARE v_mid       CHAR(36);
    DECLARE v_major_id  CHAR(36);
    DECLARE v_record_id CHAR(36);

    /*── 1. resolve member ─────────────────────────────────────*/
    SELECT mid
      INTO v_mid
      FROM members
     WHERE national_id = p_national_id
     LIMIT 1;

    IF v_mid IS NULL THEN
        SIGNAL SQLSTATE '45000'
           SET MESSAGE_TEXT = 'No member with that national_id';
    END IF;

    /*── 2. resolve major ──────────────────────────────────────*/
    SELECT major_id
      INTO v_major_id
      FROM majors
     WHERE major_name = p_major_name
     LIMIT 1;

    IF v_major_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
           SET MESSAGE_TEXT = 'No such major';
    END IF;

    /*── 3. duplicate check  (mid, major) must be unique ───────*/
    IF EXISTS (
        SELECT 1 FROM std_records
        WHERE mid = v_mid AND major_id = v_major_id
    ) THEN
        SIGNAL SQLSTATE '45000'
           SET MESSAGE_TEXT = 'Student already registered for this major';
    END IF;

    /*── 4. insert; record_id auto‑filled by DEFAULT UUID() ─────*/
    INSERT INTO std_records (mid, major_id)
    VALUES (v_mid, v_major_id);

    /*── 5. fetch & return the new UUID (optional) ─────────────*/
    SELECT record_id
      INTO v_record_id
      FROM std_records
     WHERE mid = v_mid AND major_id = v_major_id
     LIMIT 1;

    SELECT v_record_id AS record_id;   -- result set to caller
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
    IF EXISTS (SELECT 1 FROM member WHERE national_id = p_national_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'national_id already exists';
    END IF;

    IF EXISTS (SELECT 1 FROM credentials WHERE username = p_username) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'username already taken';
    END IF;

    /*── 1. First‑member‑wins admin flag ────────────────────────────────*/
    SELECT COUNT(*) INTO v_total FROM member;
    IF v_total = 0 THEN
        SET p_is_admin = TRUE;   -- override caller value
    END IF;

    /*── 2. Insert into member ──────────────────────────────────────────*/
    INSERT INTO member(mid, is_admin, fname, lname, national_id, birthday)
    VALUES (v_mid, p_is_admin, p_fname, p_lname, p_national_id, p_birthday);

    /*── 3. Insert credentials ─────────────────────────────────────────*/
    INSERT INTO credentials(member_id, username, password_hash)
    VALUES (v_mid, p_username, p_password_hash);

    /*── 4. Return member_id ───────────────────────────────────────────*/
    SELECT v_mid AS member_id, p_is_admin AS is_admin;
END//

DELIMITER ;
