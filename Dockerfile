# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar arquivos de dependência
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Instalar dependências
RUN pnpm install

# Copiar código
COPY . .

# Garantir que o diretório drizzle exista
RUN mkdir -p drizzle

# Build (Gera dist/index.js e client/dist/)
RUN pnpm build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Instalar pnpm e PM2
RUN npm install -g pnpm pm2

# Copiar arquivos de dependência
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Instalar apenas dependências de produção
RUN pnpm install --prod

# Copiar build do servidor
COPY --from=builder /app/dist ./dist
# Copiar build do frontend (necessário para o express.static)
COPY --from=builder /app/client/dist ./client/dist
# Copiar drizzle se existir
COPY --from=builder /app/drizzle ./drizzle

# Expor porta
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Start application
CMD ["pm2-runtime", "start", "dist/index.js"]
