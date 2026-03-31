-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `openid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_openid_key`(`openid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profiles` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `profiles_owner_user_id_key`(`owner_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `module_instances` (
    `id` VARCHAR(191) NOT NULL,
    `module_type` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `profile_id` VARCHAR(191) NOT NULL,
    `sharing_status` ENUM('PRIVATE', 'SHARED') NOT NULL DEFAULT 'PRIVATE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `module_instances_owner_user_id_idx`(`owner_user_id`),
    INDEX `module_instances_profile_id_idx`(`profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `module_accesses` (
    `id` VARCHAR(191) NOT NULL,
    `module_instance_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'PARTNER') NOT NULL DEFAULT 'PARTNER',
    `access_status` ENUM('ACTIVE', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    `granted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revoked_at` DATETIME(3) NULL,

    INDEX `module_accesses_user_id_idx`(`user_id`),
    UNIQUE INDEX `module_accesses_module_instance_id_user_id_key`(`module_instance_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `day_records` (
    `id` VARCHAR(191) NOT NULL,
    `module_instance_id` VARCHAR(191) NOT NULL,
    `profile_id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `is_period` BOOLEAN NOT NULL,
    `pain_level` INTEGER NULL,
    `flow_level` INTEGER NULL,
    `color_level` INTEGER NULL,
    `note` VARCHAR(500) NULL,
    `source` ENUM('MANUAL', 'AUTO_FILLED') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `day_records_module_instance_id_date_idx`(`module_instance_id`, `date`),
    INDEX `day_records_profile_id_date_idx`(`profile_id`, `date`),
    UNIQUE INDEX `day_records_module_instance_id_profile_id_date_key`(`module_instance_id`, `profile_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `module_settings` (
    `id` VARCHAR(191) NOT NULL,
    `module_instance_id` VARCHAR(191) NOT NULL,
    `default_period_duration_days` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `module_settings_module_instance_id_key`(`module_instance_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `derived_cycles` (
    `id` VARCHAR(191) NOT NULL,
    `module_instance_id` VARCHAR(191) NOT NULL,
    `profile_id` VARCHAR(191) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `duration_days` INTEGER NOT NULL,
    `derived_from_dates` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `derived_cycles_module_instance_id_profile_id_start_date_idx`(`module_instance_id`, `profile_id`, `start_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `predictions` (
    `id` VARCHAR(191) NOT NULL,
    `module_instance_id` VARCHAR(191) NOT NULL,
    `profile_id` VARCHAR(191) NOT NULL,
    `predicted_start_date` DATE NOT NULL,
    `prediction_window_start` DATE NOT NULL,
    `prediction_window_end` DATE NOT NULL,
    `based_on_cycle_count` INTEGER NOT NULL,
    `computed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `predictions_module_instance_id_key`(`module_instance_id`),
    INDEX `predictions_profile_id_idx`(`profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `module_instances` ADD CONSTRAINT `module_instances_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `module_accesses` ADD CONSTRAINT `module_accesses_module_instance_id_fkey` FOREIGN KEY (`module_instance_id`) REFERENCES `module_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `module_accesses` ADD CONSTRAINT `module_accesses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `day_records` ADD CONSTRAINT `day_records_module_instance_id_fkey` FOREIGN KEY (`module_instance_id`) REFERENCES `module_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `day_records` ADD CONSTRAINT `day_records_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `module_settings` ADD CONSTRAINT `module_settings_module_instance_id_fkey` FOREIGN KEY (`module_instance_id`) REFERENCES `module_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `derived_cycles` ADD CONSTRAINT `derived_cycles_module_instance_id_fkey` FOREIGN KEY (`module_instance_id`) REFERENCES `module_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `derived_cycles` ADD CONSTRAINT `derived_cycles_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `predictions` ADD CONSTRAINT `predictions_module_instance_id_fkey` FOREIGN KEY (`module_instance_id`) REFERENCES `module_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `predictions` ADD CONSTRAINT `predictions_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
