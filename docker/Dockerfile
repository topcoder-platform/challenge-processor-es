# Use the base image with Node.js 10.19
FROM node:10

# Copy the current directory into the Docker image
COPY . /challenge-processor-es

# Set working directory for future use
WORKDIR /challenge-processor-es

# Install the dependencies from package.json
RUN npm install
CMD npm start
