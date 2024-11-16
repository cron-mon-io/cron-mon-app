FROM public.ecr.aws/docker/library/node:20.12-slim as builder

WORKDIR /usr/cron-mon/app

RUN npm install -g npm@latest

COPY ./app .
ENV PATH /usr/cron-mon/app/node_modules/.bin:$PATH

RUN npm install && npm run build

FROM public.ecr.aws/docker/library/caddy:2.9

COPY --from=builder /usr/cron-mon/app/dist /srv
COPY ./app/Caddyfile /etc/caddy/Caddyfile
