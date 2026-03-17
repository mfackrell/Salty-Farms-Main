FROM node:20-alpine

# Install dependencies required by Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

RUN apk add --no-cache libc6-compat openssl

RUN npm install

COPY . .

# Generate Prisma client and build the API
RUN npm run build -w apps/api

CMD ["npm","run","start","-w","apps/api"]
