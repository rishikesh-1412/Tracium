# Stage 1: Build the React app
FROM node:18 AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files into the container
COPY . ./

# Set build-time arguments for environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_DISCREPANCY_CHECKER_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_DISCREPANCY_CHECKER_URL=${REACT_APP_DISCREPANCY_CHECKER_URL}

# Build the React app
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the build output from the previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
