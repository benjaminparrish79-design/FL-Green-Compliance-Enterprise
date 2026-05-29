CREATE TABLE `complianceTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` varchar(100) NOT NULL,
	`companyId` int NOT NULL,
	`propertyId` int,
	`assignedTo` int,
	`type` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`priority` enum('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'MEDIUM',
	`status` enum('OPEN','IN_PROGRESS','COMPLETED','OVERDUE') DEFAULT 'OPEN',
	`dueDate` timestamp,
	`completedAt` timestamp,
	`completedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complianceTasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `complianceTasks_taskId_unique` UNIQUE(`taskId`)
);
--> statement-breakpoint
CREATE TABLE `ordinances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`citation` varchar(100),
	`county` varchar(100),
	`city` varchar(100),
	`active` boolean DEFAULT true,
	`priority` int DEFAULT 50,
	`keyRequirements` json,
	`prohibitedActivities` json,
	`fineAmount` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ordinances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `violations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`violationId` varchar(100) NOT NULL,
	`applicationId` int NOT NULL,
	`propertyId` int NOT NULL,
	`companyId` int NOT NULL,
	`applicatorId` int,
	`severity` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
	`rulesViolated` json,
	`violationDetails` json,
	`status` enum('OPEN','REMEDIATED','ESCALATED','CLOSED') DEFAULT 'OPEN',
	`remediationDate` timestamp,
	`remediationNotes` text,
	`inspectorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `violations_id` PRIMARY KEY(`id`),
	CONSTRAINT `violations_violationId_unique` UNIQUE(`violationId`)
);
