ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS builder

ARG APP_PATH
ARG VITE_API_URL
ARG VITE_APP_ENV=production
ARG BUILD_COMMAND="npm run build"

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_ENV=${VITE_APP_ENV}

WORKDIR /app

COPY ${APP_PATH}/package.json ./package.json
COPY ${APP_PATH}/package-lock.json ./package-lock.json

RUN npm ci

COPY ${APP_PATH}/ .

RUN ${BUILD_COMMAND}

FROM nginx:1.27-alpine AS runtime

ARG DIST_PATH=dist

COPY docker/nginx/spa.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/${DIST_PATH} /usr/share/nginx/html

EXPOSE 80
