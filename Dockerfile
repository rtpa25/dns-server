# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm@9.0.4

# Install project dependencies
RUN pnpm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the application
RUN pnpm build

# Remove the development dependencies
RUN pnpm prune --prod

# Remove the source code
RUN rm -rf src

# Expose the necessary ports (53 for DNS, 3000 for HTTP)
EXPOSE 2053/udp
EXPOSE 8080

# Start the application
CMD ["pnpm", "start"]
