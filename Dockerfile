# Use an official Node.js base image
FROM node:18.20.4

# Set the working directory in the container
WORKDIR /app

# Copy the application code into the container
COPY . /app

# Install dependencies
RUN npm install

# Expose the port for your application
EXPOSE 3000

# Run the application
CMD ["npm", "start"]

FROM nginx:1.27.0
COPY --from=build /app/public /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/
