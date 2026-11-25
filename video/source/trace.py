import numpy as np, potrace, json, sys
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB')
S=5
im=im.resize((im.width*S,im.height*S),Image.LANCZOS)
a=np.asarray(im).astype(float)
r,g,b=a[...,0],a[...,1],a[...,2]
lum=0.3*r+0.59*g+0.11*b
orange=(r-b>90)&(r>150)
dark=(lum<170)&~orange&(abs(r-b)<60)
H,W=lum.shape
def region(mask,x0,x1,y0,y1):
    m=np.zeros_like(mask); m[int(y0*S):int(y1*S),int(x0*S):int(x1*S)]=mask[int(y0*S):int(y1*S),int(x0*S):int(x1*S)]; return m
def trace(m):
    bm=potrace.Bitmap(~m)
    plist=bm.trace(turdsize=20,alphamax=1.0,opticurve=True,opttolerance=0.2)
    d=[]
    for c in plist:
        sp=c.start_point; d.append(f"M{sp.x/S:.2f},{sp.y/S:.2f}")
        for seg in c.segments:
            if seg.is_corner: d.append(f"L{seg.c.x/S:.2f},{seg.c.y/S:.2f}L{seg.end_point.x/S:.2f},{seg.end_point.y/S:.2f}")
            else: d.append(f"C{seg.c1.x/S:.2f},{seg.c1.y/S:.2f} {seg.c2.x/S:.2f},{seg.c2.y/S:.2f} {seg.end_point.x/S:.2f},{seg.end_point.y/S:.2f}")
        d.append("Z")
    return "".join(d)
# find bbox
ys,xs=np.where(dark|orange); print('bbox',xs.min()/S,xs.max()/S,ys.min()/S,ys.max()/S,file=sys.stderr)
cfg=json.loads(sys.argv[2])
out={k:{'dark':trace(region(dark,*v)),'orange':trace(region(orange,*v))} for k,v in cfg.items()}
json.dump(out,open(sys.argv[3],'w'))
