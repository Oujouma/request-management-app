FROM node:22-slim
WORKDIR /app
COPY backend/ ./
RUN npm install
EXPOSE 3000
CMD ["node", "src/index.js"]