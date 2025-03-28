install: build-containers

build-containers:
	docker compose build

npm-install:
	docker compose run --rm vue-dev bash -c 'npm install'

build-app:
	docker compose run --rm --no-deps vue-dev bash -c  'npm run build'

run:
	docker compose up caddy

run-caddy-dev:
	docker compose up caddy-dev

run-vue-dev:
	docker compose up vue-dev

reload-caddy-dev:
	docker compose exec caddy-dev caddy reload --config /etc/caddy/Caddyfile

test: static-test unit-test

unit-test:
	docker compose run --rm --no-deps vue-dev bash -c  'npm run test:unit'

static-test:
	docker compose run --rm --no-deps vue-dev bash -c  'npm run lint && npm run type-check'
