CREATE TABLE `user_saved_stocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`stock_id` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_saved_stocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_saved_stocks_user_stock_unique` UNIQUE(`user_id`,`stock_id`)
);
