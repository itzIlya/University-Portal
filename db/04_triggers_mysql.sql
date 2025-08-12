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

DROP TRIGGER IF EXISTS trg_one_head_per_dept//
CREATE TRIGGER trg_one_head_per_dept
BEFORE INSERT ON workers
FOR EACH ROW
BEGIN
    /* fire only for HEAD rows */
    IF NEW.staff_role = 'HEAD' THEN

        /* does an active (or future-dated) head already exist? */
        IF EXISTS (
               SELECT 1
                 FROM workers
                WHERE did        = NEW.did
                  AND staff_role = 'HEAD'
                  AND (
                        end_date IS NULL        -- still open-ended
                        OR end_date >= CURDATE()-- ends today / future
                      )
             ) THEN
            SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'That department already has an active head';
        END IF;

    END IF;
END//


DROP TRIGGER IF EXISTS trg_taken_courses_grade_log//
CREATE TRIGGER trg_taken_courses_grade_log
BEFORE UPDATE ON taken_courses
FOR EACH ROW
BEGIN
    /* fire *only* if the grade is different (NULL-safe) */
    IF NOT (NEW.grade <=> OLD.grade) THEN
        INSERT INTO grade_audit (
            record_id, semester_id, pcid,
            old_grade, new_grade,
            actor_mid
        )
        VALUES (
            OLD.record_id,
            OLD.semester_id,
            OLD.pcid,
            OLD.grade,
            NEW.grade,
            COALESCE(@current_mid,
                     '00000000-0000-0000-0000-000000000000')
        );
    END IF;
END//