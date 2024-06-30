# Custom DNS Server

This project is a fully functional DNS server built from scratch, featuring an HTTP client interface for querying specific domains and record types. The server includes custom logic for parsing and building UDP packets and can recursively resolve any domain.

## Features

- Custom UDP packet parsing and building
- Recursive DNS resolution
- HTTP client interface for user queries
- Support for various DNS record types

## Getting Started

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/yourusername/custom-dns-server.git
   cd custom-dns-server
   ```

2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Copy the example environment variables file and set your own values:

   ```sh
   cp .env.example .env
   ```

4. Setup your free redis at [upstash](https://console.upstash.com/redis/)

### Running the Server

To start the DNS server in dev, run:

```sh
pnpm dev
```

This will start both the UDP server for DNS queries and the HTTP server for user interactions.

### Running Tests

To execute the test suite, run:

```sh
pnpm test
```

## Usage

### HTTP API

The HTTP server provides endpoints for querying DNS records. Here is an example of how to use it:

```sh
curl -X GET "http://localhost:3000/resolve?domain=example.com&type=A"
```

This will return the A record for `example.com`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
