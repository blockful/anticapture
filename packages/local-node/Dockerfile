FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
  curl \
  git \
  unzip \
  build-essential \
  libssl-dev \
  pkg-config \
  ca-certificates \
  gnupg

# ---------------------
# Install Foundry
# ---------------------
RUN curl -L https://foundry.paradigm.xyz | bash && /root/.foundry/bin/foundryup

# Add Foundry binaries to PATH
ENV PATH="/root/.foundry/bin:${PATH}"

# ---------------------
# Install Node.js & npm
# ---------------------
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy files
COPY . .

RUN npm i

# Build contracts
RUN forge build

# Ensure script is executable
RUN chmod +x ./entrypoint.sh

EXPOSE 8545

# Run on container start
ENTRYPOINT ["./entrypoint.sh"]
