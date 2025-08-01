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
    DECLARE v_mid            CHAR(36);
    DECLARE v_major_id       CHAR(36);
    DECLARE v_record_id      CHAR(36);
    DECLARE v_active_sem     CHAR(36);
    DECLARE v_student_number CHAR(10);

    /* 1. resolve member ------------------------------------------------ */
    SELECT mid
      INTO v_mid
      FROM members
     WHERE national_id = p_national_id
     LIMIT 1;

    IF v_mid IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'No member with that national_id';
    END IF;

    /* 2. resolve major -------------------------------------------------- */
    SELECT major_id
      INTO v_major_id
      FROM majors
     WHERE major_name = p_major_name
     LIMIT 1;

    IF v_major_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'No such major';
    END IF;

    /* 3. duplicate check ----------------------------------------------- */
    IF EXISTS (
        SELECT 1 FROM std_records
         WHERE mid = v_mid AND major_id = v_major_id
    ) THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Student already registered for this major';
    END IF;

    /* 4. get active semester ------------------------------------------- */
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

    /* 5. generate a UNIQUE 10-char student number ---------------------- */
    SET v_student_number = SUBSTRING(REPLACE(UUID(),'-',''),1,10);

    WHILE EXISTS (
        SELECT 1 FROM std_records WHERE student_number = v_student_number
    ) DO
        SET v_student_number = SUBSTRING(REPLACE(UUID(),'-',''),1,10);
    END WHILE;

    /* 6. insert the record --------------------------------------------- */
    INSERT INTO std_records (mid, major_id, entrance_sem, student_number)
    VALUES (v_mid, v_major_id, v_active_sem, v_student_number);

    /* 7. return record_id + student_number ----------------------------- */
    SELECT record_id, v_student_number AS student_number, v_active_sem AS entrance_sem
      INTO v_record_id, v_student_number, v_active_sem
      FROM std_records
     WHERE mid = v_mid AND major_id = v_major_id
     LIMIT 1;

    SELECT v_record_id   AS record_id,
           v_student_number AS student_number,
           v_active_sem  AS entrance_sem;
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


DROP PROCEDURE IF EXISTS list_semesters//
CREATE PROCEDURE list_semesters ()
BEGIN
    /*
       Returns every semester with its attributes,
       newest first (by start_date, then end_date).
    */
    SELECT sid,
           start_date,
           end_date,
           sem_title,
           is_active
      FROM semesters
     ORDER BY start_date DESC, end_date DESC;
END//

DROP PROCEDURE IF EXISTS list_departments//
CREATE PROCEDURE list_departments ()
BEGIN
    /*
       Returns every department with its attributes,

    */
    SELECT did,
           department_name,
           location
      FROM departments;
END//

DROP PROCEDURE IF EXISTS list_majors//
CREATE PROCEDURE list_majors ()
BEGIN
    SELECT
        m.major_id as major_id,
        m.major_name as major_name,
        d.department_name as department_name
    FROM   majors        AS m
    JOIN   departments   AS d  ON d.did = m.did
    ORDER  BY d.department_name ASC,
              m.major_name      ASC;
END//



/*───────────────────────────────────────────────────────────────
  1. promote_member_to_staff
───────────────────────────────────────────────────────────────*/
DROP PROCEDURE IF EXISTS promote_member_to_staff//
CREATE PROCEDURE promote_member_to_staff (
    IN  p_national_id CHAR(20)
)
BEGIN
    DECLARE v_mid CHAR(36);

    -- 1. resolve member
    SELECT mid INTO v_mid
      FROM members
     WHERE national_id = p_national_id
     LIMIT 1;

    IF v_mid IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'No member with that national_id';
    END IF;

    -- 2. insert into staffs (idempotent)
    INSERT IGNORE INTO staffs(member_id) VALUES (v_mid);

    SELECT v_mid AS staff_id;
END//

/*───────────────────────────────────────────────────────────────
  2. assign_staff_role
───────────────────────────────────────────────────────────────*/
DROP PROCEDURE IF EXISTS assign_staff_role//
CREATE PROCEDURE assign_staff_role (
    IN  p_national_id    CHAR(20),
    IN  p_department_name VARCHAR(150),
    IN  p_staff_role      ENUM('INSTRUCTOR','CLERK','CHAIR','ADMIN','PROF'),
    IN  p_start_date      DATE,
    IN  p_end_date        DATE
)
BEGIN
    DECLARE v_mid  CHAR(36);
    DECLARE v_did  CHAR(36);

    -- member → mid
    SELECT mid INTO v_mid
      FROM members WHERE national_id = p_national_id LIMIT 1;
    IF v_mid IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'No member with that national_id';
    END IF;

    -- department → did
    SELECT did INTO v_did
      FROM departments WHERE department_name = p_department_name LIMIT 1;
    IF v_did IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'department_name not found';
    END IF;

    -- ensure staff row exists
    INSERT IGNORE INTO staffs(member_id) VALUES (v_mid);

    -- duplicate check (same member, dept, overlapping start date)
    IF EXISTS (
        SELECT 1 FROM workers
         WHERE member_id = v_mid
           AND did = v_did
           AND start_date = p_start_date
    ) THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Role already exists for that start_date';
    END IF;

    -- insert
    INSERT INTO workers(member_id, did, staff_role, start_date, end_date)
    VALUES (v_mid, v_did, p_staff_role, p_start_date, p_end_date);

    SELECT v_mid AS staff_id, v_did AS department_id;
END//

DROP PROCEDURE IF EXISTS add_course//
CREATE PROCEDURE add_course (
    IN p_course_name VARCHAR(200),
    IN P_course_code VARCHAR(10)
)
BEGIN
    DECLARE v_cid CHAR(36) DEFAULT (UUID());

    -- uniqueness guard
    IF EXISTS (SELECT 1 FROM courses WHERE course_name = p_course_name) THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'course_name already exists';
    END IF;
    IF EXISTS (SELECT 1 FROM courses WHERE course_code = P_course_code) THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'course_code already exists';
    END IF;

    INSERT INTO courses (cid,course_code ,course_name) VALUES (v_cid,P_course_code, p_course_name);

    SELECT v_cid AS cid;
END//


DROP PROCEDURE IF EXISTS add_presented_course//
CREATE PROCEDURE add_presented_course (
    IN p_prof_national_id CHAR(20),
    IN p_course_name      VARCHAR(200),
    IN p_sem_title        VARCHAR(30),
    IN p_capacity         INT,
    IN p_max_capacity     INT,
    IN p_on_days          VARCHAR(15),
    IN p_on_times         VARCHAR(20),
    IN p_room_label       VARCHAR(50)  -- NULLABLE
)
BEGIN
    DECLARE v_prof_id  CHAR(36);
    DECLARE v_course_id CHAR(36);
    DECLARE v_sem_id   CHAR(36);
    DECLARE v_room_id  CHAR(36);
    DECLARE v_pcid     CHAR(36) DEFAULT (UUID());

    /*── guards ────────────────────────────────────────────────*/
    IF p_capacity <= 0 OR p_max_capacity <= 0 OR p_capacity > p_max_capacity THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Invalid capacity values';
    END IF;

    /*── 1. resolve professor (must already be staff) ──────────*/
    SELECT s.member_id INTO v_prof_id
      FROM staffs s
      JOIN members m ON m.mid = s.member_id
     WHERE m.national_id = p_prof_national_id
     LIMIT 1;

    IF v_prof_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Professor not found (must be staff)';
    END IF;

    /*── 2. resolve course ------------------------------------*/
    SELECT cid INTO v_course_id
      FROM courses WHERE course_name = p_course_name LIMIT 1;
    IF v_course_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'course_name not found';
    END IF;

    /*── 3. resolve semester ----------------------------------*/
    SELECT sid INTO v_sem_id
      FROM semesters WHERE sem_title = p_sem_title LIMIT 1;
    IF v_sem_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'sem_title not found';
    END IF;

    /*── 4. optional room -------------------------------------*/
    IF p_room_label IS NOT NULL THEN
        SELECT rid INTO v_room_id
          FROM rooms WHERE room_label = p_room_label LIMIT 1;
        IF v_room_id IS NULL THEN
            SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'room_label not found';
        END IF;
    END IF;

    /*── 5. insert section ------------------------------------*/
    INSERT INTO presented_courses (
        pcid, prof_id, capacity, max_capacity,
        semester_id, on_days, on_times, room_id, course_id
    )
    VALUES (
        v_pcid, v_prof_id, p_capacity, p_max_capacity,
        v_sem_id, p_on_days, p_on_times, v_room_id, v_course_id
    );

    SELECT v_pcid AS pcid;
END//


DROP PROCEDURE IF EXISTS add_room//
CREATE PROCEDURE add_room (
    IN p_room_label VARCHAR(50),
    IN p_capacity   INT
)
BEGIN
    DECLARE v_rid CHAR(36) DEFAULT (UUID());

    /*── guards ────────────────────────────────────────────────*/
    IF p_capacity <= 0 THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'capacity must be > 0';
    END IF;

    IF EXISTS (SELECT 1 FROM rooms WHERE room_label = p_room_label) THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'room_label already exists';
    END IF;

    /*── insert ────────────────────────────────────────────────*/
    INSERT INTO rooms (rid, room_label, capacity)
    VALUES (v_rid, p_room_label, p_capacity);

    /*── return UUID ───────────────────────────────────────────*/
    SELECT v_rid AS rid;
END//



DROP PROCEDURE IF EXISTS add_student_semester//
CREATE PROCEDURE add_student_semester (
    IN p_record_id CHAR(36)
)
BEGIN
    DECLARE v_sem_id CHAR(36);

    /*── 1. ensure *one* active semester exists ─────────────────*/
    SELECT sid
      INTO v_sem_id
      FROM semesters
     WHERE is_active = TRUE
     ORDER BY start_date DESC      -- if more than one, pick latest
     LIMIT 1;

    IF v_sem_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'No active semester';
    END IF;

    /*── 2. duplicate guard (same record & semester) ───────────*/
    IF EXISTS (
        SELECT 1 FROM student_semesters
         WHERE record_id  = p_record_id
           AND semester_id = v_sem_id
    ) THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Student semester already exists';
    END IF;

    /*── 3. insert row (sem_status = ACTIVE) ───────────────────*/
    INSERT INTO student_semesters
          (record_id, semester_id, sem_status)
    VALUES (p_record_id, v_sem_id, 'ACTIVE');

    /*── 4. return semester UUID ───────────────────────────────*/
    SELECT v_sem_id AS semester_id;
END//

DROP PROCEDURE IF EXISTS list_staff_by_role//
CREATE PROCEDURE list_staff_by_role (
    IN p_staff_role ENUM('INSTRUCTOR','CLERK','CHAIR','ADMIN','PROF')
)
BEGIN
    /*── validate argument --------------------------------------*/
    IF p_staff_role NOT IN ('INSTRUCTOR','CLERK','CHAIR','ADMIN','PROF') THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Invalid staff_role';
    END IF;

    /*── return distinct staff for that role -------------------*/
    SELECT DISTINCT
           m.mid            AS staff_id,
           m.fname,
           m.lname,
           w.staff_role,
           d.department_name
    FROM   workers     w
    JOIN   members     m ON m.mid = w.member_id
    LEFT   JOIN departments d ON d.did = w.did
    WHERE  w.staff_role = p_staff_role
    ORDER  BY d.department_name, m.lname, m.fname;
END//

DROP PROCEDURE IF EXISTS list_courses//
CREATE PROCEDURE list_courses ()
BEGIN
    SELECT
        cid,
        course_code,
        course_name
    FROM   courses
    ORDER  BY course_name ASC;
END//



DROP PROCEDURE IF EXISTS list_presented_courses//
CREATE PROCEDURE list_presented_courses (
    IN p_semester_id   CHAR(36),
    IN p_department_id CHAR(36)
)
BEGIN
    /*
      Returns every presented_courses row
      • in the requested semester
      • whose professor has a worker‑record in the requested department
      Columns returned are suitable for the front‑end schedule list.
    */
    SELECT  DISTINCT
            pc.pcid,
            c.course_code,
            c.course_name,
            CONCAT(m.fname, ' ', m.lname) AS professor,
            pc.on_days,
            pc.on_times,
            COALESCE(r.room_label, 'TBA') AS room,
            pc.capacity,
            pc.max_capacity
    FROM    presented_courses pc
    JOIN    courses      c  ON c.cid  = pc.course_id
    JOIN    members      m  ON m.mid  = pc.prof_id        -- professor name
    JOIN    workers      w  ON w.member_id = pc.prof_id
    LEFT    JOIN rooms   r  ON r.rid  = pc.room_id
    WHERE   pc.semester_id = p_semester_id
      AND   w.did = p_department_id;
END//


DROP PROCEDURE IF EXISTS add_taken_course_tx//
CREATE PROCEDURE add_taken_course_tx (
    IN p_record_id   CHAR(36),
    IN p_semester_id CHAR(36),
    IN p_pcid        CHAR(36),
    IN p_status      ENUM('RESERVED','TAKING','COMPLETED')
)
BEGIN
    DECLARE v_max      INT;
    DECLARE v_taken    INT;
    DECLARE v_pc_sem   CHAR(36);

    /* 0. start transaction */
    START TRANSACTION;

    /* 1. lock the section row */
    SELECT semester_id, max_capacity
      INTO v_pc_sem, v_max
      FROM presented_courses
     WHERE pcid = p_pcid
       FOR UPDATE;

    IF v_pc_sem IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'presented_course not found';
    END IF;
    IF v_pc_sem <> p_semester_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Course not offered that semester';
    END IF;

    /* 2. verify student_semester row exists */
    IF NOT EXISTS (
        SELECT 1 FROM student_semesters
         WHERE record_id = p_record_id AND semester_id = p_semester_id
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'student_semester not found';
    END IF;

    /* 3. duplicate enrolment check */
    IF EXISTS (
        SELECT 1 FROM taken_courses
         WHERE record_id = p_record_id
           AND semester_id = p_semester_id
           AND pcid = p_pcid
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Already recorded for this section';
    END IF;

    /* 4. capacity check (count only RESERVED + TAKING) */
    SELECT COUNT(*) INTO v_taken
      FROM taken_courses
     WHERE pcid = p_pcid
       AND status IN ('RESERVED','TAKING')
       FOR UPDATE;

    IF v_taken >= v_max THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Section is full';
    END IF;

    /* 5. insert */
    INSERT INTO taken_courses (record_id, semester_id, pcid, status)
    VALUES (p_record_id, p_semester_id, p_pcid, p_status);

    COMMIT;
END//

DROP PROCEDURE IF EXISTS remove_reserved_course_tx//
CREATE PROCEDURE remove_reserved_course_tx (
    IN p_record_id   CHAR(36),
    IN p_semester_id CHAR(36),
    IN p_pcid        CHAR(36)
)
BEGIN
    DECLARE v_status ENUM('RESERVED','TAKING','COMPLETED');

    START TRANSACTION;

    /* lock the target row */
    SELECT status
      INTO v_status
      FROM taken_courses
     WHERE record_id   = p_record_id
       AND semester_id = p_semester_id
       AND pcid        = p_pcid
       FOR UPDATE;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Enrolment not found';
    END IF;

    IF v_status <> 'RESERVED' THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Only RESERVED rows can be removed';
    END IF;

    /* delete seat */
    DELETE FROM taken_courses
     WHERE record_id   = p_record_id
       AND semester_id = p_semester_id
       AND pcid        = p_pcid;

    COMMIT;
END//


DROP PROCEDURE IF EXISTS list_members//
CREATE PROCEDURE list_members ()
BEGIN
    SELECT
        m.mid,
        m.is_admin,
        m.fname,
        m.lname,
        m.national_id,
        m.birthday,
        c.username,
        c.last_login
    FROM   members      AS m
    LEFT   JOIN credentials AS c ON c.member_id = m.mid
    ORDER  BY m.lname, m.fname;
END//









/*------------------- ADMIN DELETES -----------------*/
DROP PROCEDURE IF EXISTS delete_course//
CREATE PROCEDURE delete_course (IN p_cid CHAR(36))
BEGIN
    DELETE FROM courses WHERE cid = p_cid;
END//

DROP PROCEDURE IF EXISTS delete_presented_course//
CREATE PROCEDURE delete_presented_course (IN p_Pcid CHAR(36))
BEGIN
    DELETE FROM presented_courses WHERE presented_courses.pcid = p_pcid;
END//

DROP PROCEDURE IF EXISTS delete_semester//
CREATE PROCEDURE delete_semester (IN p_sid CHAR(36))
BEGIN
    DELETE FROM semesters WHERE sid = p_sid;
END//

DROP PROCEDURE IF EXISTS delete_department//
CREATE PROCEDURE delete_department (IN p_did CHAR(36))
BEGIN
    DELETE FROM departments WHERE sid = did;
END//

DROP PROCEDURE IF EXISTS delete_major//
CREATE PROCEDURE delete_major (IN p_major_id CHAR(36))
BEGIN
    DELETE FROM majors WHERE major_id = p_major_id;
END//



DROP PROCEDURE IF EXISTS list_students_in_section//
CREATE PROCEDURE list_students_in_section (IN p_pcid CHAR(36))
BEGIN
    /*
      Returns every student who has a row in taken_courses for this section.
      status ∈ {RESERVED, TAKING, COMPLETED}
    */
    SELECT
        sr.student_number,
        sr.record_id,
        m.fname,
        m.lname,
        tc.status,
        tc.grade
    FROM   taken_courses      tc
    JOIN   student_semesters  ss ON ss.record_id       = tc.record_id and ss.semester_id = tc.semester_id
    JOIN   std_records        sr ON sr.record_id  = ss.record_id
    JOIN   members            m  ON m.mid         = sr.mid
    WHERE  tc.pcid = p_pcid
    ORDER  BY m.lname, m.fname;
END//


DROP PROCEDURE IF EXISTS list_sections_by_prof//
CREATE PROCEDURE list_sections_by_prof (
    IN p_prof_id CHAR(36)
)
BEGIN
    SELECT
        pc.pcid,
        c.course_code,
        c.course_name,
        s.sem_title,
        pc.on_days,
        pc.on_times,
        COALESCE(r.room_label,'TBA') AS room,
        pc.capacity,
        pc.max_capacity
    FROM   presented_courses pc
    JOIN   courses   c ON c.cid = pc.course_id
    JOIN   semesters s ON s.sid = pc.semester_id
    LEFT   JOIN rooms r ON r.rid = pc.room_id
    WHERE  pc.prof_id = p_prof_id
    ORDER  BY s.start_date DESC, c.course_code;
END//


DROP PROCEDURE IF EXISTS set_student_grade_tx//
CREATE PROCEDURE set_student_grade_tx (
    IN p_prof_id   CHAR(36),        -- professor / admin doing the update
    IN p_record_id CHAR(36),        -- student’s record (degree file)
    IN p_pcid      CHAR(36),        -- presented_courses id
    IN p_grade     DECIMAL(3,1)     -- 0-20 (adjust scale as needed)
)
BEGIN
    DECLARE v_prof_id     CHAR(36);
    DECLARE v_semester_id CHAR(36);

    /*── validate grade range (example 0-20) ───────────────────*/
    IF p_grade < 0 OR p_grade > 20 THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'grade must be between 0 and 20';
    END IF;

    START TRANSACTION;

    /*── 1. lock the section; retrieve prof_id + semester_id ───*/
    SELECT prof_id, semester_id
      INTO v_prof_id, v_semester_id
      FROM presented_courses
     WHERE pcid = p_pcid
       FOR SHARE;

    IF v_prof_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'presented_course not found';
    END IF;

    IF v_prof_id <> p_prof_id THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'You do not teach this section';
    END IF;

    /*── 2. update the grade ----------------------------------*/
    UPDATE taken_courses
       SET grade  = p_grade,
           status = 'COMPLETED'
     WHERE record_id   = p_record_id
       AND semester_id = v_semester_id
       AND pcid        = p_pcid;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'student not enrolled in this section';
    END IF;

    COMMIT;
END//

DROP PROCEDURE IF EXISTS list_record_courses//
CREATE PROCEDURE list_record_courses (
    IN p_record_id  CHAR(36),
    IN p_semester_id CHAR(36)
)
BEGIN
    /*
      Returns every taken_courses row for ONE student record in ONE semester.
    */
    SELECT
        pc.pcid,
        c.course_code,
        c.course_name,
        tc.status,
        tc.grade,
        CONCAT(mp.fname,' ',mp.lname) AS professor,
        pc.on_days,
        pc.on_times,
        pc.room_id  AS room
    FROM   taken_courses       tc
    JOIN   presented_courses   pc ON pc.pcid      = tc.pcid
    JOIN   courses             c  ON c.cid        = pc.course_id
    JOIN   staffs             st ON st.member_id       = pc.prof_id
    JOIN members mp ON mp.mid = st.member_id
    JOIN   rooms             ON pc.room_id       = rooms.rid
    WHERE  tc.record_id   = p_record_id
      AND  tc.semester_id = p_semester_id
    ORDER  BY c.course_code;
END//


DROP PROCEDURE IF EXISTS deactivate_semester//
CREATE PROCEDURE deactivate_semester (IN p_sid CHAR(36))
BEGIN
    DECLARE v_was_active BOOLEAN;

    START TRANSACTION;

    /* 1. flip the flag & set end_date = today ---------------------- */
    UPDATE semesters
       SET is_active = FALSE,
           end_date  = CURDATE()
     WHERE sid = p_sid;

    /*  did we actually change anything?  */
    SET v_was_active = (ROW_COUNT() > 0);

    /* 2. if the semester existed, mark course rows ---------------- */
    IF v_was_active THEN
        UPDATE taken_courses
           SET status = 'COMPLETED'
         WHERE semester_id = p_sid
           AND status <> 'COMPLETED';
    ELSE
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'semester not found';
    END IF;

    COMMIT;
END//





/* #################################---------------------------------################################# */
/* #################################| ***************************** |################################# */
/* #################################| *          TRIGGERS         * |################################# */
/* #################################| ***************************** |################################# */
/* #################################|-------------------------------|################################# */
DROP TRIGGER IF EXISTS sem_before_update//
CREATE TRIGGER sem_before_update
BEFORE UPDATE ON semesters
FOR EACH ROW
BEGIN
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        SET NEW.end_date = CURDATE();
    END IF;
END//

DROP PROCEDURE IF EXISTS set_reserved_to_taking_tx//
CREATE PROCEDURE set_reserved_to_taking_tx (
    IN p_prof_id   CHAR(36),  -- caller’s member id
    IN p_is_admin  BOOLEAN,   -- TRUE if admin user
    IN p_record_id CHAR(36),
    IN p_pcid      CHAR(36)
)
BEGIN
    DECLARE v_prof_id     CHAR(36);
    DECLARE v_semester_id CHAR(36);

    START TRANSACTION;

    /* 1. lock the section row & fetch professor + semester --------- */
    SELECT prof_id, semester_id
      INTO v_prof_id, v_semester_id
      FROM presented_courses
     WHERE pcid = p_pcid
       FOR SHARE;              -- shared lock, row exists check

    IF v_prof_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'presented_course not found';
    END IF;

    /* 2. permission: non-admin must teach the section -------------- */
    IF NOT p_is_admin AND v_prof_id <> p_prof_id THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'You do not teach this section';
    END IF;

    /* 3. update status only if row exists in RESERVED -------------- */
    UPDATE taken_courses
       SET status = 'TAKING'
     WHERE record_id   = p_record_id
       AND semester_id = v_semester_id
       AND pcid        = p_pcid
       AND status      = 'RESERVED';

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Row not in RESERVED state';
    END IF;

    COMMIT;
END//

DROP PROCEDURE IF EXISTS list_rooms//
CREATE PROCEDURE list_rooms ()
BEGIN
    SELECT
        rid,
        room_label,
        capacity
    FROM rooms
    ORDER BY room_label;
END//

DELIMITER ;
