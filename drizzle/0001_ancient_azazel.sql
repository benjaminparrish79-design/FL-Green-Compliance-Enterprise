CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`companyId` int NOT NULL,
	`applicatorId` int,
	`treatmentType` enum('fertilizer','pesticide','irrigation') NOT NULL,
	`applicationDate` timestamp,
	`scheduledDate` timestamp,
	`status` enum('pending','completed','cancelled') DEFAULT 'pending',
	`nitrogenRate` decimal(8,2),
	`phosphorusRate` decimal(8,2),
	`potassiumRate` decimal(8,2),
	`totalAreaSqft` decimal(12,2),
	`gpsCoordinates` json,
	`notes` text,
	`photos` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(100) NOT NULL,
	`userId` int,
	`tenantId` int,
	`companyId` int,
	`eventType` varchar(100) NOT NULL,
	`resourceType` varchar(100),
	`resourceId` varchar(100),
	`action` varchar(50),
	`changes` json,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLog_id` PRIMARY KEY(`id`),
	CONSTRAINT `auditLog_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`licenseNumber` varchar(100),
	`fdacsLicense` varchar(100),
	`county` varchar(100),
	`city` varchar(100),
	`address` text,
	`phone` varchar(20),
	`email` varchar(320),
	`complianceScore` decimal(5,2) DEFAULT '100',
	`active` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`propertyId` int NOT NULL,
	`companyId` int NOT NULL,
	`isCompliant` boolean NOT NULL,
	`status` enum('COMPLIANT','VIOLATION') NOT NULL,
	`severity` enum('LOW','MEDIUM','HIGH','CRITICAL'),
	`violations` json,
	`validatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complianceResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` varchar(100) NOT NULL,
	`companyId` int NOT NULL,
	`tenantId` int NOT NULL,
	`deviceType` enum('vehicle','equipment','worker_phone'),
	`name` varchar(255) NOT NULL,
	`status` enum('active','inactive','maintenance') DEFAULT 'active',
	`lastLocationUpdate` timestamp,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_deviceId_unique` UNIQUE(`deviceId`)
);
--> statement-breakpoint
CREATE TABLE `gpsLocations` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`tenantId` int NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`accuracy` decimal(8,2),
	`speed` decimal(8,2),
	`heading` decimal(6,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gpsLocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255),
	`address` varchar(255) NOT NULL,
	`city` varchar(100),
	`county` varchar(100),
	`zipCode` varchar(10),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`turfSqft` decimal(12,2),
	`propertyType` enum('residential','commercial','municipal'),
	`active` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`plan` enum('basic','professional','enterprise') DEFAULT 'basic',
	`active` boolean DEFAULT true,
	`settings` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `workOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workOrderId` varchar(100) NOT NULL,
	`companyId` int NOT NULL,
	`propertyId` int NOT NULL,
	`assignedTo` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','assigned','in_progress','completed','cancelled') DEFAULT 'pending',
	`priority` enum('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'MEDIUM',
	`dueDate` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `workOrders_workOrderId_unique` UNIQUE(`workOrderId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','manager','field_worker') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `companyId` int;