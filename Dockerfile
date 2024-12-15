# Use an official Node.js base image for building the Svelte app
FROM node:18.20.4 AS build

# Set the working directory in the container
WORKDIR /app

# Copy the application code into the container
COPY . /app

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install dependencies
RUN npm install

# Build the Svelte app
RUN npm run build

# Use NGINX to serve the static files
FROM nginx:1.27.0

# Copy the client-side build output to NGINX's document root
COPY --from=build /app/build /usr/share/nginx/html

# Ensure necessary directories exist and set proper permissions
RUN mkdir -p /var/cache/nginx /var/run/nginx \
  && chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/run/nginx

# Remove the default NGINX configuration file
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom NGINX configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]

