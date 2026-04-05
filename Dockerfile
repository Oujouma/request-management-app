FROM node:22-slim
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
EXPOSE 3000
CMD ["node", "src/index.js"]