-- -- 04_triggers_mysql.sql
-- USE university;

-- -- ── audit table ───────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS grade_audit;
-- CREATE TABLE grade_audit (
--     audit_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
--     enrollment_id INT         NOT NULL,
--     old_grade     DECIMAL(3,1),
--     new_grade     DECIMAL(3,1),
--     changed_at    DATETIME DEFAULT CURRENT_TIMESTAMP
-- ) ENGINE = InnoDB;

-- -- ── trigger ───────────────────────────────────────────────────────────────────
-- DELIMITER //

-- DROP TRIGGER IF EXISTS trg_grade_audit//
-- CREATE TRIGGER trg_grade_audit
-- AFTER UPDATE ON enrollment
-- FOR EACH ROW
-- BEGIN
--     -- MySQL’s NULL‑safe equality operator (<=>) returns TRUE
--     -- when both sides are NULL *or* equal; FALSE otherwise.
--     IF NOT (NEW.grade <=> OLD.grade) THEN
--         INSERT INTO grade_audit (enrollment_id, old_grade, new_grade)
--         VALUES (OLD.enrollment_id, OLD.grade, NEW.grade);
--     END IF;
-- END//

-- DELIMITER ;
