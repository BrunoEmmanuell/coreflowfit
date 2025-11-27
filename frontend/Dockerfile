# frontend/Dockerfile

# Estágio 1: Build do React
FROM node:18-alpine as build

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci --silent

# Copia o código e faz o build de produção
COPY . .
RUN npm run build

# Estágio 2: Servidor Web (Nginx)
FROM nginx:alpine

# Copia os arquivos estáticos gerados no estágio anterior
# Nota: Se você usa Vite, a pasta pode ser /app/dist. Se usa CRA, é /app/build.
COPY --from=build /app/build /usr/share/nginx/html

# Copia nossa configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]