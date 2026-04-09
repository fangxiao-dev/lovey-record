-- AlterTable
ALTER TABLE `module_accesses` MODIFY `role` ENUM('OWNER', 'VIEWER', 'PARTNER') NOT NULL DEFAULT 'PARTNER';

-- CreateTable
CREATE TABLE `invite_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `module_instance_id` VARCHAR(191) NOT NULL,
    `created_by_user_id` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `used_by_user_id` VARCHAR(191) NULL,

    UNIQUE INDEX `invite_tokens_token_key`(`token`),
    INDEX `invite_tokens_module_instance_id_idx`(`module_instance_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `invite_tokens` ADD CONSTRAINT `invite_tokens_module_instance_id_fkey` FOREIGN KEY (`module_instance_id`) REFERENCES `module_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
