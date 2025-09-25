# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY green-tech-africa/package.json green-tech-africa/package-lock.json ./
RUN npm ci

# Copy source
COPY green-tech-africa/ ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
