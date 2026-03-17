FROM node:20-alpine

# Use the correct libraries for Alpine 3.x
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# In an npm workspace, you MUST copy all package.json files to resolve links
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

RUN npm install

COPY . .

# Explicitly generate prisma client for the correct target
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build -w apps/api

# Standard Cloud Run port handler
ENV PORT 8080
CMD ["npm", "run", "start", "-w", "apps/api"]
