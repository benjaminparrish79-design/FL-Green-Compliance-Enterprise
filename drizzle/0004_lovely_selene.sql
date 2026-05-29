CREATE TABLE `evidence_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`violationId` int,
	`complianceTaskId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`files` json,
	`hash` varchar(256),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `evidence_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`complianceDeadline` boolean DEFAULT true,
	`workOrderAssigned` boolean DEFAULT true,
	`workOrderCompleted` boolean DEFAULT true,
	`geofenceBreach` boolean DEFAULT true,
	`deviceOffline` boolean DEFAULT true,
	`deviceMaintenance` boolean DEFAULT true,
	`violationDetected` boolean DEFAULT true,
	`subscriptionAlert` boolean DEFAULT true,
	`billingAlert` boolean DEFAULT true,
	`inspectionComplete` boolean DEFAULT true,
	`systemAlert` boolean DEFAULT true,
	`emailNotifications` boolean DEFAULT true,
	`smsNotifications` boolean DEFAULT false,
	`pushNotifications` boolean DEFAULT true,
	`quietHoursEnabled` boolean DEFAULT false,
	`quietHoursStart` varchar(5),
	`quietHoursEnd` varchar(5),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`channels` json,
	`read` boolean DEFAULT false,
	`readAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `security_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int,
	`eventType` varchar(100) NOT NULL,
	`severity` enum('low','medium','high','critical') DEFAULT 'medium',
	`ipAddress` varchar(45),
	`userAgent` text,
	`description` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`resourceType` varchar(100),
	`quantity` int DEFAULT 1,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usage_events_id` PRIMARY KEY(`id`)
);
