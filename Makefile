install: build-containers npm-install

build-containers:
	docker compose build --no-cache

npm-install:
	docker compose run --rm app bash -c 'npm install'

build-app:
	docker compose run --rm --no-deps app bash -c  'npm run build'

run:
	docker compose up app

test: 
	@echo "Tests not yet implemented" && exit -1
