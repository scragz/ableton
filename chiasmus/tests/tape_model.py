"""Offline model of the Tape engine head path (Hermite catch-up + reverse play), mirroring
src/chiasmus.genexpr. Prints head-to-write-head distance; it must stay bounded (~0.69 s at 400 ms).
Usage: python3 tests/tape_model.py"""
sr=44100; period=0.4*sr; smooth=0.3; fade=0.01+smooth*0.49; rate=1; pre=0
launchLen=period/(1-fade)
wAbs=0; countdown=0; tState=0; tPos=0; tVel=0
mx=0
for n in range(int(sr*6)):
    launch=0; countdown-=1
    if countdown<=0: countdown=period; launch=1
    if launch:
        tT=launchLen*(1-fade); tCatch=max(64,tT*(0.05+smooth*0.45)); tPlay=max(64,tT-tCatch)
        moving=tState>0.5
        tP0=tPos if moving else wAbs-pre-1; tV0=tVel if moving else 0
        tV1=-rate; tP1=wAbs+tCatch-pre-1-(tCatch*0.5+2); tAge=0; tState=1
    if tState>0.5:
        if tState<1.5:
            s=tAge/tCatch; s2=s*s; s3=s2*s
            tpos=(2*s3-3*s2+1)*tP0+(s3-2*s2+s)*tCatch*tV0+(3*s2-2*s3)*tP1+(s3-s2)*tCatch*tV1
            tvel=((6*s2-6*s)*tP0+(6*s-6*s2)*tP1)/tCatch+(3*s2-4*s+1)*tV0+(3*s2-2*s)*tV1
            tAge+=1
            if tAge>=tCatch: tState=2; tAge=0
        else:
            tpos=tP1+tV1*tAge; tvel=tV1; tAge+=1
        tpos=min(tpos,wAbs-2); tPos=tpos; tVel=tvel
        mx=max(mx,wAbs-tpos)
    wAbs+=1
    if n%int(sr*0.5)==0: print(round(n/sr,2),'dist %.3fs'%((wAbs-tPos)/sr), 'state',tState)
print('max dist s',mx/sr)
