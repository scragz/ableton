#!/usr/bin/env python3
"""Send local OSC messages to the temporary Vril QA harness only."""
import socket,struct,sys

def string(s):
    b=str(s).encode()+b'\0'
    return b+b'\0'*((-len(b))%4)
def send(name,*args):
    tags=',';data=b''
    for v in args:
        try:v=float(v)
        except (ValueError,TypeError):pass
        if isinstance(v,(float,int)):tags+='f';data+=struct.pack('>f',v)
        else:tags+='s';data+=string(v)
    socket.socket(socket.AF_INET,socket.SOCK_DGRAM).sendto(string(name)+string(tags)+data,('127.0.0.1',7479))
if __name__=='__main__':send(*sys.argv[1:])
