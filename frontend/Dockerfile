# frontend/Dockerfile

# Stage 1: Build React
# Update from node:18-alpine to node:22-alpine
FROM node:22-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
# The command below creates the /app/dist folder
# Adiciona a variável de ambiente para o build do Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Web Server (Nginx)
FROM nginx:alpine

# Copy static files from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]