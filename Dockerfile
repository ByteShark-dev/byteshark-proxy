FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY public ./public
COPY src ./src

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=127.0.0.1

EXPOSE 8080

CMD ["npm", "start"]
