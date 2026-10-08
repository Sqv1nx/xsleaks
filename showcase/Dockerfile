FROM node:20-alpine
WORKDIR /app
COPY showcase/package.json ./
RUN npm install --omit=dev
COPY showcase/server.js ./
COPY showcase/public ./public
RUN mkdir -p /app/shared/uploads /app/shared/reports
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["node", "server.js"]
