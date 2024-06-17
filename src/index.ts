import * as dgram from 'node:dgram';

const udpSocket: dgram.Socket = dgram.createSocket('udp4');
udpSocket.bind(2053, '127.0.0.1');

udpSocket.on('message', async (_data: Buffer, remoteAddr: dgram.RemoteInfo) => {
	try {
		const response = Buffer.alloc(512);
		udpSocket.send(response, remoteAddr.port, remoteAddr.address);
	} catch (e) {
		console.log(`Error sending data: ${e}`);
	}
});

