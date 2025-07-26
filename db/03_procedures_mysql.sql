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

DELIMITER ;
