# Use the base image with Node.js 10.19
FROM node:12.22.12

# Copy the current directory into the Docker image
COPY . /challenge-processor-es

# Set working directory for future use
WORKDIR /challenge-processor-es

# Install the dependencies from package.json
RUN yarn install
CMD node src/app.js
