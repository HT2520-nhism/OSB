FROM node:20-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build


EXPOSE 3041

CMD ["node","dist/src/main.js"]