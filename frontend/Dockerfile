# frontend/Dockerfile

# Estágio 1: Build do React
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
# O comando abaixo cria a pasta /app/dist
RUN npm run build

# Estágio 2: Servidor Web (Nginx)
FROM nginx:alpine

# CORREÇÃO AQUI: Mudamos de /app/build para /app/dist
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]