FROM public.ecr.aws/docker/library/node:23.11-slim AS builder

WORKDIR /usr/cron-mon/app

RUN npm install -g npm@latest

COPY ./app .
ENV PATH /usr/cron-mon/app/node_modules/.bin:$PATH

RUN npm install && npm run build

FROM public.ecr.aws/docker/library/caddy:2.9

COPY ./entrypoint.sh /entrypoint.sh
COPY --from=builder /usr/cron-mon/app/dist /srv
COPY ./Caddyfile /etc/caddy/Caddyfile

ENTRYPOINT ["/entrypoint.sh"]
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
