install: build-containers

build-containers:
	docker compose build --no-cache

npm-install:
	docker compose run --rm dev bash -c 'npm install'

build-app:
	docker compose run --rm --no-deps dev bash -c  'npm run build'

run:
	docker compose up caddy

test: static-test unit-test

unit-test:
	docker compose run --rm --no-deps dev bash -c  'npm run test:unit'

static-test:
	docker compose run --rm --no-deps dev bash -c  'npm run lint && npm run type-check'
