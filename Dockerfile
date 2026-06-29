FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    linux-headers \
    eudev-dev \
    libusb-dev

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production

CMD ["npx", "ts-node", "src/index.ts"]
