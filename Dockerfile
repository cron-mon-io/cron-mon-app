FROM public.ecr.aws/docker/library/node:20.12-slim as builder

WORKDIR /usr/cron-mon/app

RUN npm install -g npm@latest

COPY ./app .
ENV PATH /usr/cron-mon/app/node_modules/.bin:$PATH

RUN npm install && npm run build

FROM public.ecr.aws/docker/library/nginx:1.27

COPY ./entrypoint.sh /entrypoint.sh
COPY --from=builder /usr/cron-mon/app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/templates/nginx.conf.template

ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx

# ENTRYPOINT ["/entrypoint.sh"]
# CMD ["nginx", "-g", "daemon off;"]
# CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
