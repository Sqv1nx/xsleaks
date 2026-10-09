FROM ghcr.io/puppeteer/puppeteer:22.10.0

USER root
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY bot.js ./

ENV NODE_ENV=production
ENV PORT=9999
EXPOSE 9999

USER pptruser
CMD ["node", "bot.js"]
