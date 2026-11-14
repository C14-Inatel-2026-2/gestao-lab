# Build dos arquivos estaticos.
FROM node:20-alpine AS build

WORKDIR /app

# Copiar os manifestos antes do codigo aproveita o cache do Docker: a
# instalacao so e refeita quando as dependencias mudam.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# Servidor estatico com proxy para a API.
FROM nginx:1.27-alpine

# curl atende ao healthcheck do Compose.
RUN apk add --no-cache curl

# A imagem do nginx expande ${BACKEND_URL} nos templates ao iniciar o container.
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
