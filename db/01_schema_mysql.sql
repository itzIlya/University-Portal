USE university;
/*───────────────────────────────────────────────────────────────
  00_drop_everything.sql   – idempotent teardown (dev only)
───────────────────────────────────────────────────────────────*/
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS grade_audit;
DROP TABLE IF EXISTS taken_courses;
DROP TABLE IF EXISTS student_semesters;
DROP TABLE IF EXISTS prerequisites;
DROP TABLE IF EXISTS presented_courses;
DROP TABLE IF EXISTS workers;
DROP TABLE IF EXISTS staffs;
DROP TABLE IF EXISTS std_records;
DROP TABLE IF EXISTS majors;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS semesters;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS credentials;
DROP TABLE IF EXISTS members;
SET FOREIGN_KEY_CHECKS = 1;
/*───────────────────────────────────────────────────────────────
  01_schema_mysql_uuid.sql
───────────────────────────────────────────────────────────────*/

-- Helper comment: UUID() returns “aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee”
-- We store it in CHAR(36) columns everywhere.

-- ── core person table ─────────────────────────────────────────
CREATE TABLE members (
    mid         CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    is_admin    BOOLEAN      NOT NULL DEFAULT FALSE,
    fname       VARCHAR(100) NOT NULL,
    lname       VARCHAR(100) NOT NULL,
    national_id CHAR(20)     NOT NULL UNIQUE,
    birthday    DATE         NOT NULL
) ENGINE = InnoDB;

CREATE TABLE credentials (
    member_id     CHAR(36)    PRIMARY KEY,
    username      VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(256)     NOT NULL,
    last_login    DATETIME,
    FOREIGN KEY (member_id) REFERENCES members(mid) ON DELETE CASCADE
) ENGINE = InnoDB;


-- ── departments & majors ─────────────────────────────────────
CREATE TABLE departments (
    did       CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    department_name VARCHAR(150) NOT NULL UNIQUE,
    location  VARCHAR(200)
) ENGINE = InnoDB;

CREATE TABLE majors (
    major_id   CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    major_name VARCHAR(150) NOT NULL UNIQUE,
    did        CHAR(36)     NOT NULL,
    FOREIGN KEY (did) REFERENCES departments(did)
        ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE semesters (
    sid        CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,
    sem_title  VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_one_active CHECK (is_active IN (0,1))
) ENGINE = InnoDB;

-- ── student “file” per degree/major ──────────────────────────
CREATE TABLE std_records (
    record_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    mid       CHAR(36) NOT NULL,   -- FK → member
    gpa       DECIMAL(4,3),
    major_id  CHAR(36) NOT NULL,   -- FK → majors
    entrance_sem CHAR(36) NOT NULL,
    UNIQUE KEY uq_student_major (mid, major_id),
    FOREIGN KEY (entrance_sem) REFERENCES semesters(sid),
    FOREIGN KEY (mid)      REFERENCES members(mid),
    FOREIGN KEY (major_id) REFERENCES majors(major_id)
        ON DELETE CASCADE
) ENGINE = InnoDB;

-- ── staff & worker roles (subset of member) ──────────────────
CREATE TABLE staffs (
    member_id CHAR(36) PRIMARY KEY,
    FOREIGN KEY (member_id) REFERENCES members(mid)
        ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE workers (
    member_id  CHAR(36) NOT NULL,
    did        CHAR(36) NOT NULL,
    staff_role ENUM('INSTRUCTOR','CLERK','CHAIR','ADMIN', 'PROF') NOT NULL,
    start_date DATE  NOT NULL,
    end_date   DATE,
    PRIMARY KEY (member_id, did, start_date),
    FOREIGN KEY (member_id) REFERENCES staffs(member_id)
        ON DELETE CASCADE,
    FOREIGN KEY (did)       REFERENCES departments(did)
) ENGINE = InnoDB;

-- ── auxiliary tables ─────────────────────────────────────────
CREATE TABLE rooms (
    rid        CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    room_label VARCHAR(50) NOT NULL UNIQUE,
    capacity   INT CHECK (capacity > 0)
) ENGINE = InnoDB;


CREATE TABLE courses (
    cid         CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    course_name VARCHAR(200) NOT NULL UNIQUE
) ENGINE = InnoDB;

CREATE TABLE prerequisites (
    course_id       CHAR(36) NOT NULL,
    prerequisite_id CHAR(36) NOT NULL,
    PRIMARY KEY (course_id, prerequisite_id),
    CHECK (course_id <> prerequisite_id),
    FOREIGN KEY (course_id)       REFERENCES courses(cid) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_id) REFERENCES courses(cid) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ── course sections offered in a semester ────────────────────
CREATE TABLE presented_courses (
    pcid        CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    prof_id     CHAR(36) NOT NULL,                  -- FK → staffs
    capacity    INT      NOT NULL CHECK (capacity > 0),
    max_capacity    INT      NOT NULL CHECK (max_capacity > 0),
    semester_id CHAR(36) NOT NULL,                  -- FK → semesters
    on_days     VARCHAR(15) NOT NULL,               -- e.g. "MWF"
    on_times    VARCHAR(20) NOT NULL,               -- "10:00‑11:15"
    room_id     CHAR(36),                           -- FK → rooms
    course_id   CHAR(36) NOT NULL,                  -- FK → courses
    FOREIGN KEY (prof_id)     REFERENCES staffs(member_id),
    FOREIGN KEY (semester_id) REFERENCES semesters(sid),
    FOREIGN KEY (room_id)     REFERENCES rooms(rid),
    FOREIGN KEY (course_id)   REFERENCES courses(cid)
) ENGINE = InnoDB;

-- ── semester summary row per student record ──────────────────
CREATE TABLE student_semesters (
    record_id   CHAR(36) NOT NULL,
    semester_id CHAR(36) NOT NULL,
    sem_gpa     DECIMAL(4,3),
    sem_status  ENUM('ACTIVE','ON_LEAVE') NOT NULL,
    PRIMARY KEY (record_id, semester_id),
    FOREIGN KEY (record_id)   REFERENCES std_records(record_id)
        ON DELETE CASCADE,
    FOREIGN KEY (semester_id) REFERENCES semesters(sid)
) ENGINE = InnoDB;

-- ── every course section taken in that semester ──────────────
CREATE TABLE taken_courses (
    record_id   CHAR(36) NOT NULL,
    semester_id CHAR(36) NOT NULL,
    pcid        CHAR(36) NOT NULL,        -- FK → presented_courses
    grade       DECIMAL(3,1),
    PRIMARY KEY (record_id, semester_id, pcid),
    FOREIGN KEY (record_id, semester_id)
        REFERENCES student_semesters(record_id, semester_id)
        ON DELETE CASCADE,
    FOREIGN KEY (pcid) REFERENCES presented_courses(pcid)
) ENGINE = InnoDB;

-- ── optional audit table ─────────────────────────────────────
CREATE TABLE grade_audit (
    audit_id    CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    record_id   CHAR(36) NOT NULL,
    semester_id CHAR(36) NOT NULL,
    pcid        CHAR(36) NOT NULL,
    old_grade   DECIMAL(3,1),
    new_grade   DECIMAL(3,1),
    changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;
