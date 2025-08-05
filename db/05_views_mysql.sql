/* #################################----------------------------------################################# */
/* #################################| ****************************** |################################# */
/* #################################| *            VIEWS           * |################################# */
/* #################################| ****************************** |################################# */
/* #################################|--------------------------------|################################# */
USE university;

-- ── View 1: GPA per student-record  ----------------------------------------
CREATE OR REPLACE VIEW vw_record_gpa AS
SELECT
    sr.record_id,
    sr.major_id,
    /* AVG ignores NULL so ungraded records → NULL */
    (
        SELECT AVG(tc.grade)
        FROM   taken_courses tc
        WHERE  tc.record_id = sr.record_id
          AND  tc.status     = 'COMPLETED'
          AND  tc.grade IS NOT NULL
    ) AS gpa
FROM std_records sr;

-- ── View 2: average GPA per major  ----------------------------------------
CREATE OR REPLACE VIEW vw_major_avg_gpa AS
SELECT
    m.major_id,
    m.major_name,
    ROUND(AVG(rg.gpa), 2) AS avg_gpa        -- NULL-aware average
FROM   majors m
LEFT JOIN vw_record_gpa rg ON rg.major_id = m.major_id
GROUP BY m.major_id, m.major_name
ORDER BY m.major_name;