FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Set the build-time API URL
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the React app
RUN npm run build

# Install a static file server to serve the built files
RUN npm install -g serve

# Expose port (you can change to 80 if you want)
EXPOSE 3000

# Serve the build directory
CMD ["serve", "-s", "build", "-l", "3000"]
