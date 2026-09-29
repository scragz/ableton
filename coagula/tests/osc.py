"""Send one OSC message to a Coagula QA build (udpreceive 7474).
usage: python3 tests/osc.py /drop /path/to/file.wav | /set tx 30 | /note 60 100 | /node qa /tmp/coagula-qa.log"""
import socket
import struct
import sys


def pad(b):
    return b + b'\0' * (4 - len(b) % 4)


def encode(addr, args):
    tags, data = ',', b''
    for a in args:
        try:
            if '.' in a or 'e' in a.lower():
                v = float(a); tags += 'f'; data += struct.pack('>f', v); continue
            v = int(a); tags += 'i'; data += struct.pack('>i', v); continue
        except ValueError:
            tags += 's'; data += pad(a.encode())
    return pad(addr.encode()) + pad(tags.encode()) + data


if __name__ == '__main__':
    socket.socket(socket.AF_INET, socket.SOCK_DGRAM).sendto(encode(sys.argv[1], sys.argv[2:]), ('127.0.0.1', 7474))
