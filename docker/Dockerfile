# Use the base image with Node.js 
FROM 18.16.1
# Copy the current directory into the Docker image
COPY . /challenge-processor-es

# Set working directory for future use
WORKDIR /challenge-processor-es

# Install the dependencies from package.json
RUN yarn install
CMD node src/app.js
