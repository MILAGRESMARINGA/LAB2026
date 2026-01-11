FROM node:20-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --production
COPY . .
ENV NODE_ENV=production
EXPOSE 3333
CMD ["node", "server.js"]
