"use strict";

module.exports = function(values) {
	return {
		questions: [
			{
				type: "confirm",
				name: "apiGW",
				message: "Add API Gateway (moleculer-web) service?",
				default: true
			},
			{
				type: "confirm",
				name: "needTransporter",
				message: "Would you like to communicate with other nodes?",
				default: true
			},
			{
				type: "list",
				name: "transporter",
				message: "Select a transporter",
				choices: [
					{ name: "NATS (recommended)", value: "NATS" },
					{ name: "Redis", value: "Redis" },
					{ name: "MQTT", value: "MQTT" },
					{ name: "AMQP", value: "AMQP" },
					{ name: "TCP", value: "TCP" },
					{ name: "NATS Streaming", value: "STAN" },
					{ name: "Kafka", value: "Kafka" },
					{ name: "AMQP 1.0 (experimental)", value: "AMQP10" }
				],
				when(answers) { return answers.needTransporter; },
				default: "NATS"
			},
			{
				type: "confirm",
				name: "needCacher",
				message: "Would you like to use cache?",
				default: false
			},
			{
				type: "list",
				name: "cacher",
				message: "Select a cacher solution",
				choices: [
					{ name: "Memory", value: "Memory" },
					{ name: "Redis", value: "Redis" }
				],
				when(answers) { return answers.needCacher; },
				default: "Memory"
			},
			{
				type: "confirm",
				name: "dbService",
				message: "Add DB sample service?",
				default: true
			},
			{
				type: "confirm",
				name: "userService",
				message: "Add User sample service? (authenticate)",
				default: true
			},
			{
				type: "confirm",
				name: "metrics",
				message: "Would you like to enable metrics?",
				default: true
			},
			{
				type: "confirm",
				name: "tracing",
				message: "Would you like to enable tracing?",
				default: true
			},
			{
				type: "confirm",
				name: "docker",
				message: "Add Docker & Kubernetes sample files?",
				default: true
			},
			{
				type: "confirm",
				name: "lint",
				message: "Use ESLint to lint your code?",
				default: true
			}
		],

		metalsmith: {
			before(metalsmith) {
				const data = metalsmith.metadata();
				data.redis = data.cacher == "Redis" || data.transporter == "Redis";
				data.hasDepends = (data.needCacher && data.cacher !== 'Memory') || (data.needTransporter && data.transporter != "TCP");
			}
		},

		skipInterpolation: [
			//"public/index.html"
		],

		filters: {
			"src/services/api.service.ts": "apiGW",
			"public/**/*": "apiGW",

			"src/services/products.service.ts": "dbService",
			"tests/integration/services/products.service.spec.ts": "dbService",
			"tests/unit/services/products.spec.ts": "dbService",
			"database/development/dbname_product.csv": "dbService",
			"database/production/dbname_product.csv": "dbService",
			"database/test/dbname_product-test.csv": "dbService",

			"src/services/user.service.ts": "userService",
			"src/mixins/db-user.mixin.ts": "userService",
			"src/types/user.ts": "userService",
			"src/entities/converters/user/user-lang.converter.ts": "userService",
			"src/entities/converters/user/user-role.converter.ts": "userService",
			"src/entities/user.entity.ts": "userService",
			"src/entities/index.ts": "userService",
			"tests/helpers/user.helper.ts": "userService",
			"tests/integration/services/user.service.spec.ts": "userService",
			"tests/unit/entities/converters/user/user-lang.converter.spec.ts": "userService",
			"tests/unit/entities/converters/user/user-role.converter.spec.ts": "userService",
			"tests/unit/services/user.service.spec.ts": "userService",
			"database/development/dbname_user.csv": "userService",
			"database/production/dbname_user.csv": "userService",
			"database/test/dbname_user-test.csv": "userService",

			".eslintrc.js": "lint",
			".eslintignore": "lint",

			".dockerignore": "docker",
			"docker-compose.*": "docker",
			"Dockerfile": "docker",
			"k8s.yaml": "docker"
		},

		completeMessage: `
To get started:

	cd {{projectName}}
	npm run dev

		`
	};
};
