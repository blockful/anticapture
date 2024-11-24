# Use an official Node.js runtime as the base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your NestJS server will run on
EXPOSE 3000

RUN npx prisma generate

RUN npm run build

# Run the migrations and start the server
CMD ["sh", "-c", "npm run start:prod"]