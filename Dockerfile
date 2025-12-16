# Dùng image chuẩn của Puppeteer (đã có sẵn Chrome đúng phiên bản)
FROM ghcr.io/puppeteer/puppeteer:latest

# Chuyển sang root để cài thư viện
USER root

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Chuyển lại quyền cho user mặc định để chạy an toàn
USER pptruser

EXPOSE 3000
CMD [ "node", "index.js" ]
