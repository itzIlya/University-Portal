-- 01_schema_mysql.sql
-- Safe reruns in dev: drop first (CASCADE handled automatically in InnoDB)
DROP TABLE IF EXISTS grade_audit;
DROP TABLE IF EXISTS enrollment;
DROP TABLE IF EXISTS section;
DROP TABLE IF EXISTS course;
DROP TABLE IF EXISTS professor;
DROP TABLE IF EXISTS student;

CREATE TABLE student (
    student_id  INT AUTO_INCREMENT PRIMARY KEY,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    entered_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE TABLE professor (
    professor_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name    VARCHAR(150) NOT NULL,
    email        VARCHAR(255) NOT NULL UNIQUE
) ENGINE = InnoDB;

CREATE TABLE course (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    code      VARCHAR(20)  NOT NULL UNIQUE,       -- CS101
    title     VARCHAR(200) NOT NULL,
    credits   TINYINT      NOT NULL CHECK (credits BETWEEN 1 AND 6)
) ENGINE = InnoDB;

CREATE TABLE section (
    section_id   INT AUTO_INCREMENT PRIMARY KEY,
    course_id    INT NOT NULL,
    professor_id INT NOT NULL,
    term         VARCHAR(20) NOT NULL,            -- 2025-Fall
    capacity     INT        NOT NULL CHECK (capacity > 0),
    UNIQUE KEY uk_course_term_prof (course_id, term, professor_id),
    CONSTRAINT fk_section_course    FOREIGN KEY (course_id)    REFERENCES course(course_id)    ON DELETE CASCADE,
    CONSTRAINT fk_section_professor FOREIGN KEY (professor_id) REFERENCES professor(professor_id)
) ENGINE = InnoDB;

CREATE TABLE enrollment (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id    INT NOT NULL,
    section_id    INT NOT NULL,
    enrolled_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    grade         DECIMAL(3,1),
    UNIQUE KEY uk_student_section (student_id, section_id),
    CONSTRAINT fk_enroll_student FOREIGN KEY (student_id) REFERENCES student(student_id),
    CONSTRAINT fk_enroll_section FOREIGN KEY (section_id) REFERENCES section(section_id) ON DELETE CASCADE
) ENGINE = InnoDB;
