# Use official Node.js LTS version
FROM node:20-alpine

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your API code
COPY . .

# Expose the port your API listens on
EXPOSE 5000

# Command to start your API
CMD ["node", "server.js"]
