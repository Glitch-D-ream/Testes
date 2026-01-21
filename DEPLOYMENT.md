# Guia de Deployment

> **Detector de Promessa Vazia - Deployment em Produção**

Guia completo para fazer deploy da aplicação em produção em diferentes plataformas.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Variáveis de Ambiente](#variáveis-de-ambiente)
3. [Railway](#railway)
4. [Render](#render)
5. [VPS (DigitalOcean, Linode, AWS)](#vps)
6. [Docker](#docker)
7. [Monitoramento](#monitoramento)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Pré-requisitos

Antes de fazer deploy, certifique-se de:

- [ ] Todos os testes passando (`pnpm test`)
- [ ] Build funcionando (`pnpm build`)
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado
- [ ] SSL/TLS configurado
- [ ] Backups configurados

---

## 🔐 Variáveis de Ambiente

### Obrigatórias

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/detector_promessa_vazia

# JWT
JWT_SECRET=sua_chave_secreta_muito_segura_min_32_caracteres

# Node
NODE_ENV=production
PORT=3000

# CORS
CORS_ORIGIN=https://seu-dominio.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=10
```

### Opcionais

```env
# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/detector-promessa-vazia/app.log

# Sentry (Error Tracking)
SENTRY_DSN=https://seu-sentry-dsn@sentry.io/project

# Redis (Cache)
REDIS_URL=redis://user:password@host:6379

# Email (Notificações)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app

# Analytics
ANALYTICS_ENABLED=true
```

---

## 🚀 Railway

### 1. Criar Conta e Projeto

```bash
# Instale Railway CLI
npm install -g @railway/cli

# Login
railway login

# Criar novo projeto
railway init
```

### 2. Conectar Repositório

1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub"
4. Autorize e selecione seu repositório
5. Railway detectará automaticamente Node.js

### 3. Configurar Variáveis de Ambiente

```bash
# Via CLI
railway variables set DATABASE_URL "mysql://..."
railway variables set JWT_SECRET "sua-chave-secreta"
railway variables set NODE_ENV "production"

# Ou via Dashboard
# Settings → Variables → Add Variable
```

### 4. Adicionar Banco de Dados

```bash
# Railway oferece MySQL integrado
railway add

# Selecione MySQL
# Railway criará automaticamente DATABASE_URL
```

### 5. Deploy

```bash
# Deploy automático via GitHub (recomendado)
# Qualquer push para main fará deploy automático

# Ou deploy manual
railway up
```

### 6. Verificar Status

```bash
# Ver logs
railway logs

# Ver status
railway status

# Acessar aplicação
railway open
```

**Vantagens:**
- ✅ Setup muito simples
- ✅ Deploy automático via GitHub
- ✅ Banco de dados integrado
- ✅ SSL automático
- ✅ Escalabilidade automática

**Desvantagens:**
- ❌ Mais caro que VPS
- ❌ Menos controle

**Custo:** $5-50/mês (dependendo do uso)

---

## 🎨 Render

### 1. Criar Conta

Acesse [render.com](https://render.com) e crie uma conta.

### 2. Conectar Repositório GitHub

1. Dashboard → "New +"
2. Selecione "Web Service"
3. Conecte seu repositório GitHub
4. Autorize Render

### 3. Configurar Serviço

**Nome:** `detector-promessa-vazia`

**Ambiente:** Node

**Build Command:**
```bash
pnpm install && pnpm build
```

**Start Command:**
```bash
pnpm start
```

**Plan:** Starter ($7/mês) ou Pro ($12/mês)

### 4. Adicionar Variáveis de Ambiente

1. Environment → Add Environment Variable
2. Adicione todas as variáveis obrigatórias

```
DATABASE_URL = mysql://...
JWT_SECRET = sua-chave-secreta
NODE_ENV = production
```

### 5. Adicionar Banco de Dados

1. Dashboard → "New +"
2. Selecione "MySQL"
3. Render fornecerá DATABASE_URL automaticamente
4. Copie para variáveis de ambiente

### 6. Deploy

```bash
# Deploy automático via GitHub
# Qualquer push para main fará deploy

# Ou via CLI
render deploy
```

### 7. Executar Migrations

```bash
# Após primeiro deploy
render exec pnpm db:push
```

**Vantagens:**
- ✅ Muito simples de usar
- ✅ Deploy automático
- ✅ Banco integrado
- ✅ SSL automático
- ✅ Preço razoável

**Desvantagens:**
- ❌ Menos controle que VPS
- ❌ Pode ter downtime em atualizações

**Custo:** $7-50/mês

---

## 🖥️ VPS

### 1. Provisionar Servidor

**Recomendações:**
- **DigitalOcean:** $6/mês (1GB RAM, 1 vCPU)
- **Linode:** $5/mês (1GB RAM, 1 vCPU)
- **AWS EC2:** $5-20/mês (t3.micro free tier)

**Especificações Mínimas:**
- 1 vCPU
- 2GB RAM
- 50GB SSD
- Ubuntu 22.04 LTS

### 2. Setup Inicial

```bash
# SSH no servidor
ssh root@seu-ip

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar Git
apt install -y git

# Instalar MySQL
apt install -y mysql-server

# Instalar Nginx
apt install -y nginx

# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Instalar Certbot (SSL)
apt install -y certbot python3-certbot-nginx
```

### 3. Clonar Repositório

```bash
# Criar diretório
mkdir -p /var/www/detector-promessa-vazia
cd /var/www/detector-promessa-vazia

# Clonar repositório
git clone https://github.com/Glitch-D-ream/Testes.git .

# Instalar dependências
pnpm install

# Build
pnpm build
```

### 4. Configurar Banco de Dados

```bash
# Login MySQL
mysql -u root -p

# Criar banco
CREATE DATABASE detector_promessa_vazia;
CREATE USER 'detector'@'localhost' IDENTIFIED BY 'senha_segura_123';
GRANT ALL PRIVILEGES ON detector_promessa_vazia.* TO 'detector'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Executar migrations
pnpm db:push
```

### 5. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
nano /var/www/detector-promessa-vazia/.env

# Adicionar variáveis
DATABASE_URL=mysql://detector:senha_segura_123@localhost:3306/detector_promessa_vazia
JWT_SECRET=sua-chave-secreta-muito-segura
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://seu-dominio.com
```

### 6. Configurar PM2

```bash
# Criar arquivo ecosystem.config.js
cat > /var/www/detector-promessa-vazia/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'detector-promessa-vazia',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/detector-promessa-vazia/error.log',
    out_file: '/var/log/detector-promessa-vazia/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
EOF

# Iniciar com PM2
pm2 start ecosystem.config.js

# Configurar para iniciar no boot
pm2 startup
pm2 save
```

### 7. Configurar Nginx

```bash
# Criar arquivo de configuração
nano /etc/nginx/sites-available/detector-promessa-vazia

# Adicionar configuração
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Ativar site
ln -s /etc/nginx/sites-available/detector-promessa-vazia /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

### 8. Configurar SSL/TLS

```bash
# Gerar certificado Let's Encrypt
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática (cron)
certbot renew --quiet

# Verificar status
certbot certificates
```

### 9. Configurar Firewall

```bash
# Habilitar UFW
ufw enable

# Permitir SSH
ufw allow 22/tcp

# Permitir HTTP
ufw allow 80/tcp

# Permitir HTTPS
ufw allow 443/tcp

# Verificar status
ufw status
```

### 10. Monitoramento e Logs

```bash
# Ver logs em tempo real
pm2 logs

# Ver status de processos
pm2 status

# Monitorar recursos
pm2 monit

# Ver logs do Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

**Vantagens:**
- ✅ Controle total
- ✅ Mais barato
- ✅ Sem limitações
- ✅ Performance melhor

**Desvantagens:**
- ❌ Mais complexo de configurar
- ❌ Você é responsável por manutenção
- ❌ Precisa gerenciar segurança

**Custo:** $5-20/mês

---

## 🐳 Docker

### 1. Criar Dockerfile

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm pm2

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

EXPOSE 3000

CMD ["pm2-runtime", "start", "dist/index.js"]
```

### 2. Criar docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://detector:senha@db:3306/detector_promessa_vazia
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      - db
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: detector_promessa_vazia
      MYSQL_USER: detector
      MYSQL_PASSWORD: senha
    volumes:
      - db_data:/var/lib/mysql
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  db_data:
```

### 3. Build e Run

```bash
# Build
docker-compose build

# Run
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Parar
docker-compose down
```

---

## 📊 Monitoramento

### Sentry (Error Tracking)

```bash
# 1. Criar conta em sentry.io
# 2. Criar novo projeto (Node.js)
# 3. Copiar DSN

# 3. Adicionar variável de ambiente
SENTRY_DSN=https://seu-dsn@sentry.io/project

# 4. Erros serão automaticamente reportados
```

### PM2 Plus (Monitoramento)

```bash
# Criar conta em pm2.io
pm2 link seu-secret seu-public

# Dashboard em https://app.pm2.io
```

### Prometheus + Grafana

```bash
# Instalar Prometheus
docker run -d -p 9090:9090 prom/prometheus

# Instalar Grafana
docker run -d -p 3001:3000 grafana/grafana

# Configurar dashboards
```

---

## 🔧 Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs

# Verificar variáveis de ambiente
echo $DATABASE_URL

# Testar build localmente
pnpm build
pnpm start
```

### Banco de dados não conecta

```bash
# Verificar conexão MySQL
mysql -u detector -p -h localhost -D detector_promessa_vazia

# Verificar DATABASE_URL
echo $DATABASE_URL

# Testar migração
pnpm db:push
```

### Nginx retorna 502

```bash
# Verificar se app está rodando
pm2 status

# Verificar logs do Nginx
tail -f /var/log/nginx/error.log

# Verificar porta
netstat -tlnp | grep 3000
```

### SSL/TLS não funciona

```bash
# Renovar certificado
certbot renew --force-renewal

# Verificar certificado
certbot certificates

# Verificar Nginx
nginx -t
systemctl restart nginx
```

---

## 📈 Checklist de Deploy

- [ ] Todos os testes passando
- [ ] Build funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado
- [ ] SSL/TLS configurado
- [ ] Firewall configurado
- [ ] Backups configurados
- [ ] Monitoramento ativado
- [ ] Alertas configurados
- [ ] Documentação atualizada

---

## 🆘 Suporte

Para problemas de deployment:

1. Verifique os logs (`pm2 logs` ou `docker-compose logs`)
2. Verifique variáveis de ambiente
3. Verifique conectividade de banco de dados
4. Abra uma issue no GitHub

---

**Última atualização:** 21 de janeiro de 2026
