CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` varchar(64) NOT NULL,
	`subscriptionId` varchar(64) NOT NULL,
	`stripeInvoiceId` varchar(255) NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('draft','open','paid','void','uncollectible') NOT NULL,
	`paidAt` timestamp,
	`dueDate` timestamp,
	`pdfUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceId_unique` UNIQUE(`invoiceId`)
);
--> statement-breakpoint
CREATE TABLE `paymentMethods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentMethodId` varchar(64) NOT NULL,
	`stripePaymentMethodId` varchar(255) NOT NULL,
	`stripeCustomerId` varchar(255) NOT NULL,
	`type` varchar(64) NOT NULL,
	`cardBrand` varchar(64),
	`cardLast4` varchar(4),
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentMethods_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentMethods_paymentMethodId_unique` UNIQUE(`paymentMethodId`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`stripePriceId` varchar(255) NOT NULL,
	`stripeProductId` varchar(255) NOT NULL,
	`price` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`billingPeriod` enum('monthly','annual') NOT NULL,
	`maxProperties` int,
	`maxWorkOrders` int,
	`maxUsers` int,
	`features` json NOT NULL DEFAULT ('[]'),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionPlans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptionPlans_planId_unique` UNIQUE(`planId`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` varchar(64) NOT NULL,
	`tenantId` int NOT NULL,
	`companyId` int NOT NULL,
	`planId` varchar(64) NOT NULL,
	`stripeSubscriptionId` varchar(255) NOT NULL,
	`stripeCustomerId` varchar(255) NOT NULL,
	`status` enum('active','past_due','canceled','trialing') NOT NULL,
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`canceledAt` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_subscriptionId_unique` UNIQUE(`subscriptionId`)
);
--> statement-breakpoint
CREATE TABLE `usageMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricId` varchar(64) NOT NULL,
	`companyId` int NOT NULL,
	`subscriptionId` varchar(64) NOT NULL,
	`propertiesCount` int NOT NULL DEFAULT 0,
	`workOrdersCount` int NOT NULL DEFAULT 0,
	`usersCount` int NOT NULL DEFAULT 0,
	`apiCallsCount` int NOT NULL DEFAULT 0,
	`storageUsedMb` int NOT NULL DEFAULT 0,
	`billingPeriodStart` timestamp NOT NULL,
	`billingPeriodEnd` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usageMetrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `usageMetrics_metricId_unique` UNIQUE(`metricId`)
);
