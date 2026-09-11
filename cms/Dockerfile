# Stage 1: Build CMS React application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . ./
RUN npm run build

# Stage 2: Serve with Nginx and reverse proxy to API
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY 15-clean-api-url.envsh /docker-entrypoint.d/15-clean-api-url.envsh
RUN sed -i 's/\r$//' /docker-entrypoint.d/15-clean-api-url.envsh && chmod +x /docker-entrypoint.d/15-clean-api-url.envsh
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

ENV API_URL=http://api:8000

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

