-- Deliverable D2:
DROP DATABASE IF EXISTS school_exam_db;
CREATE DATABASE school_exam_db;
USE school_exam_db;

-- 1. User_Login (Authentication)
CREATE TABLE User_Login (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'teacher', 'student', 'principal') NOT NULL
);

-- 2. Class
CREATE TABLE Class (
    class_id INT PRIMARY KEY AUTO_INCREMENT,
    class_name VARCHAR(50) NOT NULL,
    section VARCHAR(50) NOT NULL,
    UNIQUE KEY uk_class_section (class_name, section)
);

-- 3. Subject
CREATE TABLE Subject (
    subject_id INT PRIMARY KEY AUTO_INCREMENT,
    subject_name VARCHAR(100) NOT NULL UNIQUE,
    credits INT DEFAULT 3
);

-- 4. Exam (Master Record)
CREATE TABLE Exam (
    exam_id INT PRIMARY KEY AUTO_INCREMENT,
    exam_name VARCHAR(100) NOT NULL,
    exam_date DATE
);

-- 5. Grade (Lookup Table)
CREATE TABLE Grade (
    grade_id INT PRIMARY KEY AUTO_INCREMENT,
    grade_letter VARCHAR(5) NOT NULL UNIQUE,
    mark_range_low DECIMAL(5, 2) NOT NULL,
    mark_range_high DECIMAL(5, 2) NOT NULL
);

-- 6. Teacher
CREATE TABLE Teacher (
    teacher_id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    user_id INT NOT NULL UNIQUE,
    FOREIGN KEY (user_id) REFERENCES User_Login(user_id) ON DELETE CASCADE
);

-- 7. Student
CREATE TABLE Student (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    student_name VARCHAR(100) NOT NULL,
    roll_no VARCHAR(50) NOT NULL UNIQUE,
    dob DATE,
    gender VARCHAR(10),
    class_id INT NOT NULL,
    user_id INT NOT NULL UNIQUE,
    FOREIGN KEY (class_id) REFERENCES Class(class_id) ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User_Login(user_id) ON DELETE CASCADE
);

-- 8. Exam_Schedule (Linking Exam -> Class -> Subject -> Teacher)
CREATE TABLE Exam_Schedule (
    schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    exam_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES Exam(exam_id) ON UPDATE CASCADE,
    FOREIGN KEY (class_id) REFERENCES Class(class_id) ON UPDATE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES Subject(subject_id) ON UPDATE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES Teacher(teacher_id) ON UPDATE CASCADE,
    UNIQUE KEY uk_exam_schedule (exam_id, class_id, subject_id)
);

-- 9. Marks
CREATE TABLE Marks (
    mark_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    schedule_id INT NOT NULL,
    marks_obtained DECIMAL(5, 2) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES Student(student_id) ON UPDATE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES Exam_Schedule(schedule_id) ON UPDATE CASCADE,
    UNIQUE KEY uk_student_exam (student_id, schedule_id),
    CHECK (marks_obtained BETWEEN 0 AND 100)
);