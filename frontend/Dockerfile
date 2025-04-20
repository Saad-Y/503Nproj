FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the default React dev server port
EXPOSE 3000

# Start the React app in dev mode
CMD ["npm", "start"]
