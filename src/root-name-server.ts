// ;       This file holds the information on root name servers needed to
// ;       initialize cache of Internet domain name servers
// ;       (e.g. reference this file in the "cache  .  <file>"
// ;       configuration file of BIND domain name servers).
// ;
// ;       This file is made available by InterNIC
// ;       under anonymous FTP as
// ;           file                /domain/named.cache
// ;           on server           FTP.INTERNIC.NET
// ;       -OR-                    RS.INTERNIC.NET
// ;
// ;       last update:     May 28, 2024
// ;       related version of root zone:     2024052801
// ;
// ; FORMERLY NS.INTERNIC.NET
// ;
// .                        3600000      NS    A.ROOT-SERVERS.NET.
// A.ROOT-SERVERS.NET.      3600000      A     198.41.0.4
// A.ROOT-SERVERS.NET.      3600000      AAAA  2001:503:ba3e::2:30
// ;
// ; FORMERLY NS1.ISI.EDU
// ;
// .                        3600000      NS    B.ROOT-SERVERS.NET.
// B.ROOT-SERVERS.NET.      3600000      A     170.247.170.2
// B.ROOT-SERVERS.NET.      3600000      AAAA  2801:1b8:10::b
// ;
// ; FORMERLY C.PSI.NET
// ;
// .                        3600000      NS    C.ROOT-SERVERS.NET.
// C.ROOT-SERVERS.NET.      3600000      A     192.33.4.12
// C.ROOT-SERVERS.NET.      3600000      AAAA  2001:500:2::c
// ;
// ; FORMERLY TERP.UMD.EDU
// ;
// .                        3600000      NS    D.ROOT-SERVERS.NET.
// D.ROOT-SERVERS.NET.      3600000      A     199.7.91.13
// D.ROOT-SERVERS.NET.      3600000      AAAA  2001:500:2d::d
// ;
// ; FORMERLY NS.NASA.GOV
// ;
// .                        3600000      NS    E.ROOT-SERVERS.NET.
// E.ROOT-SERVERS.NET.      3600000      A     192.203.230.10
// E.ROOT-SERVERS.NET.      3600000      AAAA  2001:500:a8::e
// ;
// ; FORMERLY NS.ISC.ORG
// ;
// .                        3600000      NS    F.ROOT-SERVERS.NET.
// F.ROOT-SERVERS.NET.      3600000      A     192.5.5.241
// F.ROOT-SERVERS.NET.      3600000      AAAA  2001:500:2f::f
// ;
// ; FORMERLY NS.NIC.DDN.MIL
// ;
// .                        3600000      NS    G.ROOT-SERVERS.NET.
// G.ROOT-SERVERS.NET.      3600000      A     192.112.36.4
// G.ROOT-SERVERS.NET.      3600000      AAAA  2001:500:12::d0d
// ;
// ; FORMERLY AOS.ARL.ARMY.MIL
// ;
// .                        3600000      NS    H.ROOT-SERVERS.NET.
// H.ROOT-SERVERS.NET.      3600000      A     198.97.190.53
// H.ROOT-SERVERS.NET.      3600000      AAAA  2001:500:1::53
// ;
// ; FORMERLY NIC.NORDU.NET
// ;
// .                        3600000      NS    I.ROOT-SERVERS.NET.
// I.ROOT-SERVERS.NET.      3600000      A     192.36.148.17
// I.ROOT-SERVERS.NET.      3600000      AAAA  2001:7fe::53
// ;
// ; OPERATED BY VERISIGN, INC.
// ;
// .                        3600000      NS    J.ROOT-SERVERS.NET.
// J.ROOT-SERVERS.NET.      3600000      A     192.58.128.30
// J.ROOT-SERVERS.NET.      3600000      AAAA  2001:503:c27::2:30
// ;
// ; OPERATED BY RIPE NCC
// ;
// .                        3600000      NS    K.ROOT-SERVERS.NET.
// K.ROOT-SERVERS.NET.      3600000      A     193.0.14.129
// K.ROOT-SERVERS.NET.      3600000      AAAA  2001:7fd::1
// ;
// ; OPERATED BY ICANN
// ;
// .                        3600000      NS    L.ROOT-SERVERS.NET.
// L.ROOT-SERVERS.NET.      3600000      A     199.7.83.42
// L.ROOT-SERVERS.NET.      3600000      AAAA  2001:500:9f::42
// ;
// ; OPERATED BY WIDE
// ;
// .                        3600000      NS    M.ROOT-SERVERS.NET.
// M.ROOT-SERVERS.NET.      3600000      A     202.12.27.33
// M.ROOT-SERVERS.NET.      3600000      AAAA  2001:dc3::35
// ; End of file

export const rootNameServers = [
	{
		ns: 'A.ROOT-SERVERS.NET',
		ipv4: '198.41.0.4',
		ipv6: '2001:503:ba3e::2:30',
		ttl: 36_00_000,
	},
	{
		ns: 'B.ROOT-SERVERS.NET',
		ipv4: '170.247.170.2',
		ipv6: '2801:1b8:10::b',
		ttl: 36_00_000,
	},
	{
		ns: 'C.ROOT-SERVERS.NET',
		ipv4: '192.33.4.12',
		ipv6: '2001:500:2::c',
		ttl: 36_00_000,
	},
	{
		ns: 'D.ROOT-SERVERS.NET',
		ipv4: '199.7.91.13',
		ipv6: '2001:500:2d::d',
		ttl: 36_00_000,
	},
	{
		ns: 'E.ROOT-SERVERS.NET',
		ipv4: '192.203.230.10',
		ipv6: '2001:500:a8::e',
		ttl: 36_00_000,
	},
	{
		ns: 'F.ROOT-SERVERS.NET',
		ipv4: '192.5.5.241',
		ipv6: '2001:500:2f::f',
		ttl: 36_00_000,
	},
	{
		ns: 'G.ROOT-SERVERS.NET',
		ipv4: '192.112.36.4',
		ipv6: '2001:500:12::d0d',
		ttl: 36_00_000,
	},
	{
		ns: 'H.ROOT-SERVERS.NET',
		ipv4: '198.97.190.53',
		ipv6: '2001:500:1::53',
		ttl: 36_00_000,
	},
	{
		ns: 'I.ROOT-SERVERS.NET',
		ipv4: '192.36.148.17',
		ipv6: '2001:7fe::53',
		ttl: 36_00_000,
	},
	{
		ns: 'J.ROOT-SERVERS.NET',
		ipv4: '192.58.128.30',
		ipv6: '2001:503:c27::2:30',
		ttl: 36_00_000,
	},
	{
		ns: 'K.ROOT-SERVERS.NET',
		ipv4: '193.0.14.129',
		ipv6: '2001:7fd::1',
		ttl: 36_00_000,
	},
	{
		ns: 'L.ROOT-SERVERS.NET',
		ipv4: '199.7.83.42',
		ipv6: '2001:500:9f::42',
		ttl: 36_00_000,
	},
	{
		ns: 'M.ROOT-SERVERS.NET',
		ipv4: '202.12.27.33',
		ipv6: '2001:dc3::35',
		ttl: 36_00_000,
	},
];

