/* eslint-disable */

/** 
* LICENSE MIT
* (C) Daniel Zelisko
* http://github.com/danielzzz/node-ping
*
* A poor man's ping for node.js
* It uses UDP_scanning (as node is not able to generate iCPM packets)
* http://en.wikipedia.org/wiki/Port_scanner#UDP_scanning
* it may not work correct for hosts that silently drop UDP traffic on their firewall
* you need at pcap version 0.1.9 or higher
* 
*/

var sys = require("util"),
pcap = require('pcap');
    
var addr = process.argv[3] || 'localhost';
setInterval(function() {probe(addr)}, 1000);


function probe(addr) {
    sys.puts('sending a probe to ' + addr);
    var dgram = require('dgram');
    var message = new Buffer("Some bytes");
    var client = dgram.createSocket("udp4");
    client.send(message, 0, message.length, 21111, addr);
    client.close(); 
}

// create a pcap session
pcap_session = pcap.createSession(process.argv[2] || 'eth0', "");


// listen for packets, decode them, and feed the simple printer
pcap_session.addListener('packet', function (raw_packet) {
    var packet = pcap.decode.packet(raw_packet);
    if (packet.link && packet.link.ip && packet.link.ip.saddr==addr) {
        packet.link && packet.link.ip && sys.puts(packet.link.ip.saddr + " is alive");
    }
});

//-------- example ------------------------


