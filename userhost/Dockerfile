FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
RUN mkdir -p /app/uploads && chown -R node:node /app
ENV NODE_ENV=production
ENV PORT=9001
EXPOSE 9001
USER node
CMD ["node", "server.js"]
