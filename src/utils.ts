export function getRandomEntry<T>(array: T[]): T {
	if (array.length === 0) {
		throw new Error('Cannot select from an empty array');
	}
	const randomIndex = Math.floor(Math.random() * array.length);
	return array[randomIndex] as T;
}

export function decodeDomainName(
	buffer: Buffer,
	offset: number,
): [string, number] {
	const labels = [];
	let jumped = false;
	let initialOffset = offset;

	while (offset < buffer.length) {
		const length = buffer[offset];
		if (!length) break;

		if (length === 0) {
			offset += 1;
			break;
		}

		if ((length & 0xc0) === 0xc0) {
			// Pointer
			if (!jumped) {
				initialOffset = offset + 2;
			}
			const pointerOffset = ((length & 0x3f) << 8) | buffer[offset + 1]!;
			offset = pointerOffset;
			jumped = true;
		} else {
			if (length === 0) {
				offset++;
				break;
			}
			// Label
			offset += 1;
			labels.push(buffer.slice(offset, offset + length).toString());
			offset += length;
		}
	}

	if (!jumped) {
		initialOffset = offset;
	}

	return [labels.join('.'), initialOffset];
}

export function decodeRDATA(rdataBuffer: Buffer): string {
	const [domainName] = decodeDomainName(rdataBuffer, 0);
	return domainName;
}

export function isValidDomain(domain: string) {
	// Regular expression pattern for domain name validation
	const domainRegex = /^[a-zA-Z0-9]+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

	// Check if the domain matches the pattern
	return domainRegex.test(domain);
}

