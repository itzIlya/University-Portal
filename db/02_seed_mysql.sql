-- 02_seed_mysql.sql
INSERT IGNORE INTO student(first_name,last_name,email)
VALUES ('Jane','Doe','j.doe@demo.edu');

INSERT IGNORE INTO professor(full_name,email)
VALUES ('Dr. Ada Lovelace','ada@demo.edu');

INSERT IGNORE INTO course(code,title,credits)
VALUES ('CS101','Intro to Programming',3);

-- insert section only if course & prof exist
INSERT INTO section(course_id,professor_id,term,capacity)
SELECT c.course_id, p.professor_id, '2025-Fall', 30
FROM course c, professor p
WHERE c.code='CS101' AND p.email='ada@demo.edu'
ON DUPLICATE KEY UPDATE capacity=capacity;  -- no‑op, keeps statement idempotent
