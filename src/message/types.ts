export enum QRIndicator {
	QUERY = 0,
	RESPONSE = 1,
}

export enum Bool {
	FALSE = 0,
	TRUE = 1,
}

export enum OPCODE {
	QUERY = 0,
	IQUERY = 1,
	STATUS = 2,
}

export enum RCode {
	NOERROR = 0,
	FORMERR = 1,
	SERVFAIL = 2,
	NXDOMAIN = 3,
	NOTIMP = 4,
	REFUSED = 5,
}

export interface DNSHeader {
	ID: number; // Packet identifier -- a random id assigned to query packets. Response packets should reply with the same id - 16 bits
	QR: QRIndicator; // Query/Response flag -- 0 for query, 1 for response -- 1 bit
	OPCODE: OPCODE; // Operation code -- 0 for standard query -- 4 bits
	AA: Bool; // Authoritative Answer -- 1 if the responding server is an authority for the domain name in question else 0 -- 1 bit
	TC: Bool; // TrunCation -- 1 if the message is larger than 512 bytes. Always 0 for UDP -- 1 bit
	RD: Bool; // Recursion Desired -- 1 if the client wants the server to query other servers on its behalf --> recursively resolve the query else 0 -- 1 bit
	RA: Bool; // Recursion Available -- 1 if the server supports recursion else 0 -- 1 bit
	Z: 0; // Reserved for future use. Must be 0 -- 3 bits
	RCODE: RCode; // Response code -- 0 for no error -- 4 bits
	QDCOUNT: number; // Number of entries in the question section --> generally 1 -- 16 bits
	ANCOUNT: number; // Number of resource records in the answer section --> as many resources are needed to resolve the query -- 16 bits
	NSCOUNT: number; // Number of name server resource records in the authority records section --> 16 bits
	ARCOUNT: number; // Number of resource records in the additional records section --> 16 bits
}

// TYPE            value and meaning
// A               1 a host address
// NS              2 an authoritative name server
// MD              3 a mail destination (Obsolete - use MX)
// MF              4 a mail forwarder (Obsolete - use MX)
// CNAME           5 the canonical name for an alias
// SOA             6 marks the start of a zone of authority
// MB              7 a mailbox domain name (EXPERIMENTAL)
// MG              8 a mail group member (EXPERIMENTAL)
// MR              9 a mail rename domain name (EXPERIMENTAL)
// NULL            10 a null RR (EXPERIMENTAL)
// WKS             11 a well known service description
// PTR             12 a domain name pointer
// HINFO           13 host information
// MINFO           14 mailbox or mail list information
// MX              15 mail exchange
// TXT             16 text strings
export enum RECORD_TYPE {
	A = 1,
	NS = 2,
	MD = 3,
	MF = 4,
	CNAME = 5,
	SOA = 6,
	MB = 7,
	MG = 8,
	MR = 9,
	NULL = 10,
	WKS = 11,
	PTR = 12,
	HINFO = 13,
	MINFO = 14,
	MX = 15,
	TXT = 16,
}

export enum RECORD_TYPE_STRING {
	A = 'A',
	NS = 'NS',
	MD = 'MD',
	MF = 'MF',
	CNAME = 'CNAME',
	SOA = 'SOA',
	MB = 'MB',
	MG = 'MG',
	MR = 'MR',
	NULL = 'NULL',
	WKS = 'WKS',
	PTR = 'PTR',
	HINFO = 'HINFO',
	MINFO = 'MINFO',
	MX = 'MX',
	TXT = 'TXT',
}

export interface DNSQuestion {
	NAME: string; // The domain name, encoded as a sequence of labels. Each label consists of a length octet followed by that number of octets. The domain name is terminated with a length of 0. -- variable length

	TYPE: RECORD_TYPE; // Type of the query -- 2 bytes integer 16 bits

	CLASS: 1; // Class of the query -- 2 bytes integer 16 bits -- usually set to 1 for internet addresses
}

export interface DNSAnswer {
	NAME: string; // The domain name, encoded as a sequence of labels. Each label consists of a length octet followed by that number of octets. The domain name is terminated with a length of 0. -- variable length

	TYPE: RECORD_TYPE; // Type of the query -- 2 bytes integer 16 bits

	CLASS: 1; // Class of the query -- 2 bytes integer 16 bits -- usually set to 1 for internet addresses

	TTL: number; // Time to live -- 4 bytes integer 32 bits

	RDLENGTH: number; // Length of the RDATA field -- 2 bytes integer 16 bits

	RDATA: Buffer; // The resource data -- variable length ex: IP address for A records -- RDLENGTH bytes long
}

export interface DNSObject {
	header: DNSHeader;
	questions: DNSQuestion[];
	answers?: DNSAnswer[];
	authority?: DNSAnswer[];
	additional?: DNSAnswer[];
}

