FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY public ./public
RUN mkdir -p /app/shared/uploads /app/shared/reports && chown -R node:node /app
ENV NODE_ENV=production
ENV PORT=9000
EXPOSE 9000
USER node
CMD ["node", "server.js"]
