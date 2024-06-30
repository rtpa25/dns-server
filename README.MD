# Custom DNS Server

This project is a fully functional DNS server built from scratch, featuring an HTTP client interface for querying specific domains and record types. The server includes custom logic for parsing and building UDP packets and can recursively resolve any domain.

## Features

- Custom UDP packet parsing and building
- Recursive DNS resolution
- HTTP client interface for user queries
- Support for various DNS record types

## Project Structure

```plaintext
src
├── message
│   ├── builder.ts             # Logic for building DNS messages
│   ├── message.test.ts        # Tests for message handling
│   ├── parser.ts              # Logic for parsing DNS messages
│   ├── types.ts               # Type definitions for DNS messages
│   ├── dns-cache.ts           # DNS caching mechanism
│   ├── env.ts                 # Environment variables handling
│   ├── forward-resolver.ts    # Forwarding resolver logic
│   ├── http-server.ts         # HTTP server for user queries
│   ├── recursive-resolver.ts  # Recursive resolver logic
│   ├── redis.ts               # Redis integration for caching
│   ├── root-name-server.ts    # Root name server logic
│   ├── udp-server.test.ts     # Tests for UDP server
│   ├── udp-server.ts          # UDP server handling DNS queries
│   ├── utils.ts               # Utility functions
├── .env                       # Environment variables
├── .env.example               # Example environment variables
├── .gitignore                 # Git ignore file
├── jest.config.js             # Jest configuration for testing
├── package.json               # Node.js project configuration
├── pnpm-lock.yaml             # pnpm lock file
├── README.md                  # Project README file
├── response.json              # Sample DNS response
├── tsconfig.json              # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (>=14.x)
- pnpm (>=6.x)

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

### Running the Server

To start the DNS server, run:

```sh
pnpm start
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
curl -X GET "http://localhost:3000/query?domain=example.com&type=A"
```

This will return the A record for `example.com`.

## Configuration

Configuration options can be set in the `.env` file. The example `.env.example` file provides a template for necessary configurations.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

This project was inspired by the need to have a custom DNS server with fine-grained control over DNS queries and responses.
```

This `README.md` provides an overview of your project, its structure, installation instructions, usage examples, and other essential information. You can customize it further as needed.