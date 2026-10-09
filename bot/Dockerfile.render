FROM node:20-slim

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app
COPY bot/package.json ./
RUN npm install --omit=dev
COPY bot/bot.js ./

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["node", "bot.js"]
