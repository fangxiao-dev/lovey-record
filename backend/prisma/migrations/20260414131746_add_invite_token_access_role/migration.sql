-- AlterTable
ALTER TABLE `invite_tokens` ADD COLUMN `access_role` ENUM('OWNER', 'VIEWER', 'PARTNER') NOT NULL DEFAULT 'VIEWER';
