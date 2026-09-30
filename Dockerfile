# build da aplicacao
FROM node:22-alpine AS build
WORKDIR /app

# Copia arquivos e dependencias e instala
COPY package*.json ./
RUN npm ci

# Copia todo o codigo e gera a compilação
COPY . .
RUN npm run build -- --configuration=production

# Servidor Web de Produção
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Limpa os arquivos padrao do nginx
RUN rm -rf ./*

# Copia a configuração personalizada do Ngins para suportar SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Compila os artefatos compilados do estágio de build
COPY --from=build /app/dist/*/browser ./

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]