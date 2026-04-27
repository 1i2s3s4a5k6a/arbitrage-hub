CREATE TABLE `alertPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`arbitrageAlerts` boolean NOT NULL DEFAULT true,
	`oddsChangeAlerts` boolean NOT NULL DEFAULT true,
	`matchUpdateAlerts` boolean NOT NULL DEFAULT true,
	`emailNotifications` boolean NOT NULL DEFAULT false,
	`pushNotifications` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertPreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('arbitrage','odds_change','match_update') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `arbitrageOpportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` varchar(255) NOT NULL,
	`type` enum('2-way','3-way') NOT NULL,
	`profitPercentage` decimal(10,4) NOT NULL,
	`roi` decimal(10,4) NOT NULL,
	`riskLevel` enum('low','medium','high') NOT NULL,
	`stakeDistribution` json NOT NULL,
	`bookmakers` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`expiredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `arbitrageOpportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`matchId` varchar(255),
	`bookmaker` varchar(100),
	`market` varchar(100),
	`odds` decimal(10,3),
	`stake` decimal(10,2),
	`outcome` enum('pending','won','lost','voided') NOT NULL DEFAULT 'pending',
	`profit` decimal(10,2),
	`roiPercentage` decimal(10,2),
	`placedAt` timestamp NOT NULL DEFAULT (now()),
	`settledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `odds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` varchar(255) NOT NULL,
	`bookmaker` varchar(100) NOT NULL,
	`market` varchar(100) NOT NULL,
	`option` varchar(100) NOT NULL,
	`oddsValue` decimal(10,3) NOT NULL,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `odds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `oddsHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` varchar(255) NOT NULL,
	`bookmaker` varchar(100) NOT NULL,
	`market` varchar(100) NOT NULL,
	`option` varchar(100) NOT NULL,
	`oddsValue` decimal(10,3) NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `oddsHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('free','pro','premium') NOT NULL,
	`status` enum('active','cancelled','expired') NOT NULL DEFAULT 'active',
	`stripeSubscriptionId` varchar(255),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','pro','premium') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('active','cancelled','expired') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);