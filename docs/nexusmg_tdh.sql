-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 11, 2026 at 12:58 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nexusmg_tdh`
--

-- --------------------------------------------------------

--
-- Table structure for table `alembic_version`
--

CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `alembic_version`
--

INSERT INTO `alembic_version` (`version_num`) VALUES
('7a3c0a1d9e2f');

-- --------------------------------------------------------

--
-- Table structure for table `cv_evaluations`
--

CREATE TABLE `cv_evaluations` (
  `id` int(11) NOT NULL,
  `evaluation_id` int(11) NOT NULL,
  `extracted_text` text DEFAULT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`skills`)),
  `experience` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`experience`)),
  `education` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`education`)),
  `projects` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`projects`)),
  `format_score` float DEFAULT NULL,
  `content_score` float DEFAULT NULL,
  `skills_score` float DEFAULT NULL,
  `experience_score` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cv_evaluations`
--

-- --------------------------------------------------------

--
-- Table structure for table `english_evaluations`
--

CREATE TABLE `english_evaluations` (
  `id` int(11) NOT NULL,
  `evaluation_id` int(11) NOT NULL,
  `assessment_type` varchar(50) DEFAULT NULL,
  `questions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`questions`)),
  `answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`answers`)),
  `grammar_score` float DEFAULT NULL,
  `vocabulary_score` float DEFAULT NULL,
  `fluency_score` float DEFAULT NULL,
  `comprehension_score` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `english_evaluations`
--

-- --------------------------------------------------------

--
-- Table structure for table `evaluations`
--

CREATE TABLE `evaluations` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `evaluation_type` enum('CV','GITHUB','LINKEDIN','IDEA','INTERVIEW','ENGLISH') NOT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','FAILED') DEFAULT NULL,
  `score` float DEFAULT NULL,
  `input_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`input_data`)),
  `analysis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`analysis`)),
  `feedback` text DEFAULT NULL,
  `recommendations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`recommendations`)),
  `file_path` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `evaluations`
--

-- --------------------------------------------------------

--
-- Table structure for table `github_evaluations`
--

CREATE TABLE `github_evaluations` (
  `id` int(11) NOT NULL,
  `evaluation_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `profile_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`profile_data`)),
  `repositories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`repositories`)),
  `activity_score` float DEFAULT NULL,
  `code_quality_score` float DEFAULT NULL,
  `diversity_score` float DEFAULT NULL,
  `documentation_score` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `idea_evaluations`
--

CREATE TABLE `idea_evaluations` (
  `id` int(11) NOT NULL,
  `evaluation_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `problem_statement` text DEFAULT NULL,
  `target_audience` text DEFAULT NULL,
  `tech_stack` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tech_stack`)),
  `innovation_score` float DEFAULT NULL,
  `feasibility_score` float DEFAULT NULL,
  `market_score` float DEFAULT NULL,
  `technical_score` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `instructor_invites`
--

CREATE TABLE `instructor_invites` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `invite_code` varchar(100) NOT NULL,
  `invited_by` int(11) NOT NULL,
  `is_used` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interview_evaluations`
--

CREATE TABLE `interview_evaluations` (
  `id` int(11) NOT NULL,
  `evaluation_id` int(11) NOT NULL,
  `questions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`questions`)),
  `answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`answers`)),
  `topic` varchar(100) DEFAULT NULL,
  `difficulty` varchar(50) DEFAULT NULL,
  `technical_score` float DEFAULT NULL,
  `communication_score` float DEFAULT NULL,
  `problem_solving_score` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `linkedin_evaluations`
--

CREATE TABLE `linkedin_evaluations` (
  `id` int(11) NOT NULL,
  `evaluation_id` int(11) NOT NULL,
  `profile_url` varchar(500) DEFAULT NULL,
  `profile_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`profile_data`)),
  `is_manual_entry` int(11) DEFAULT NULL,
  `completeness_score` float DEFAULT NULL,
  `network_score` float DEFAULT NULL,
  `engagement_score` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `readiness_scores`
--

CREATE TABLE `readiness_scores` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `overall_score` float DEFAULT NULL,
  `cv_score` float DEFAULT NULL,
  `github_score` float DEFAULT NULL,
  `linkedin_score` float DEFAULT NULL,
  `idea_score` float DEFAULT NULL,
  `interview_score` float DEFAULT NULL,
  `english_score` float DEFAULT NULL,
  `cv_completed` int(11) DEFAULT NULL,
  `github_completed` int(11) DEFAULT NULL,
  `linkedin_completed` int(11) DEFAULT NULL,
  `idea_completed` int(11) DEFAULT NULL,
  `interview_completed` int(11) DEFAULT NULL,
  `english_completed` int(11) DEFAULT NULL,
  `strengths` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`strengths`)),
  `weaknesses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`weaknesses`)),
  `recommendations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`recommendations`)),
  `career_suggestions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`career_suggestions`)),
  `summary` text DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('TRAINEE','INSTRUCTOR','ADMIN') NOT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `university` varchar(255) DEFAULT NULL,
  `major` varchar(255) DEFAULT NULL,
  `graduation_year` int(11) DEFAULT NULL,
  `github_username` varchar(100) DEFAULT NULL,
  `linkedin_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `is_onboarded` tinyint(1) DEFAULT 0,
  `onboarding_summary` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alembic_version`
--
ALTER TABLE `alembic_version`
  ADD PRIMARY KEY (`version_num`);

--
-- Indexes for table `cv_evaluations`
--
ALTER TABLE `cv_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluation_id` (`evaluation_id`),
  ADD KEY `ix_cv_evaluations_id` (`id`);

--
-- Indexes for table `english_evaluations`
--
ALTER TABLE `english_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluation_id` (`evaluation_id`),
  ADD KEY `ix_english_evaluations_id` (`id`);

--
-- Indexes for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `ix_evaluations_id` (`id`);

--
-- Indexes for table `github_evaluations`
--
ALTER TABLE `github_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluation_id` (`evaluation_id`),
  ADD KEY `ix_github_evaluations_id` (`id`);

--
-- Indexes for table `idea_evaluations`
--
ALTER TABLE `idea_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluation_id` (`evaluation_id`),
  ADD KEY `ix_idea_evaluations_id` (`id`);

--
-- Indexes for table `instructor_invites`
--
ALTER TABLE `instructor_invites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invite_code` (`invite_code`),
  ADD KEY `invited_by` (`invited_by`),
  ADD KEY `ix_instructor_invites_id` (`id`);

--
-- Indexes for table `interview_evaluations`
--
ALTER TABLE `interview_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluation_id` (`evaluation_id`),
  ADD KEY `ix_interview_evaluations_id` (`id`);

--
-- Indexes for table `linkedin_evaluations`
--
ALTER TABLE `linkedin_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluation_id` (`evaluation_id`),
  ADD KEY `ix_linkedin_evaluations_id` (`id`);

--
-- Indexes for table `readiness_scores`
--
ALTER TABLE `readiness_scores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `ix_readiness_scores_id` (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_users_email` (`email`),
  ADD KEY `instructor_id` (`instructor_id`),
  ADD KEY `ix_users_id` (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cv_evaluations`
--
ALTER TABLE `cv_evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `english_evaluations`
--
ALTER TABLE `english_evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `evaluations`
--
ALTER TABLE `evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `github_evaluations`
--
ALTER TABLE `github_evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `idea_evaluations`
--
ALTER TABLE `idea_evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `instructor_invites`
--
ALTER TABLE `instructor_invites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `interview_evaluations`
--
ALTER TABLE `interview_evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `linkedin_evaluations`
--
ALTER TABLE `linkedin_evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `readiness_scores`
--
ALTER TABLE `readiness_scores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cv_evaluations`
--
ALTER TABLE `cv_evaluations`
  ADD CONSTRAINT `cv_evaluations_ibfk_1` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`);

--
-- Constraints for table `english_evaluations`
--
ALTER TABLE `english_evaluations`
  ADD CONSTRAINT `english_evaluations_ibfk_1` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`);

--
-- Constraints for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD CONSTRAINT `evaluations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `github_evaluations`
--
ALTER TABLE `github_evaluations`
  ADD CONSTRAINT `github_evaluations_ibfk_1` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`);

--
-- Constraints for table `idea_evaluations`
--
ALTER TABLE `idea_evaluations`
  ADD CONSTRAINT `idea_evaluations_ibfk_1` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`);

--
-- Constraints for table `instructor_invites`
--
ALTER TABLE `instructor_invites`
  ADD CONSTRAINT `instructor_invites_ibfk_1` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `interview_evaluations`
--
ALTER TABLE `interview_evaluations`
  ADD CONSTRAINT `interview_evaluations_ibfk_1` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`);

--
-- Constraints for table `linkedin_evaluations`
--
ALTER TABLE `linkedin_evaluations`
  ADD CONSTRAINT `linkedin_evaluations_ibfk_1` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`);

--
-- Constraints for table `readiness_scores`
--
ALTER TABLE `readiness_scores`
  ADD CONSTRAINT `readiness_scores_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
