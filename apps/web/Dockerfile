FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm install
COPY . .
CMD ["npm","run","dev","-w","apps/web","--","--host","0.0.0.0"]
