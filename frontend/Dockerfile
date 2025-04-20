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

# Set the build-time API URL
ARG REACT_APP_API_URL

# Pass it into the React build
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Start the React app in dev mode
CMD ["npm", "start"]
