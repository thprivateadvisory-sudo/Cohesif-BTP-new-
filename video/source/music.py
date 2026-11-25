import numpy as np, wave
SR=44100; DUR=46.0; N=int(SR*DUR)
L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(7)
def add(sig,t,gain=1.0,pan=0.0):
    i=int(t*SR); 
    if i>=N: return
    s=sig[:N-i]*gain
    L[i:i+len(s)]+=s*np.sqrt((1-pan)/2)*1.414; R[i:i+len(s)]+=s*np.sqrt((1+pan)/2)*1.414
def env(n,a,d):
    t=np.arange(n)/SR; e=np.minimum(1,t/max(a,1e-4))*np.exp(-t/d); return e
def lp(x,cut):
    # one-pole lowpass, cut may be array
    a=np.exp(-2*np.pi*np.asarray(cut)/SR)*np.ones(len(x))
    y=np.zeros_like(x); s=0.0
    for i in range(len(x)): s=(1-a[i])*x[i]+a[i]*s; y[i]=s
    return y
def lpf(x,cut):  # fast fixed lowpass via FFT
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); X/= (1+(f/cut)**4)**.5; return np.fft.irfft(X,len(x))
def hpf(x,cut):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); X*= 1/(1+(cut/np.maximum(f,1))**4)**.5; return np.fft.irfft(X,len(x))
nf=lambda m:440*2**((m-69)/12)
def saw(f,n,det=0):
    t=np.arange(n)/SR; return 2*((t*f*(1+det))%1)-1
# --- drums
def kick(big=False):
    n=int(SR*(1.2 if big else .45)); t=np.arange(n)/SR
    f=45+ (110 if big else 95)*np.exp(-t*(18 if big else 30)); ph=2*np.pi*np.cumsum(f)/SR
    s=np.sin(ph)*np.exp(-t*(2.2 if big else 7))
    s+=0.25*rng.standard_normal(n)*np.exp(-t*300)
    return np.tanh(s*1.6)
def clap():
    n=int(SR*.3); t=np.arange(n)/SR; x=rng.standard_normal(n)
    e=np.zeros(n)
    for o in (0,.011,.022): e+=np.where(t>=o,np.exp(-(t-o)*(60 if o<.02 else 14)),0)
    return hpf(lpf(x*e,5000),900)*.6
def hat(open_=False):
    n=int(SR*(.25 if open_ else .06)); t=np.arange(n)/SR
    return hpf(rng.standard_normal(n),7000)*np.exp(-t*(18 if open_ else 80))
def tick():
    n=int(SR*.03); t=np.arange(n)/SR; return np.sin(2*np.pi*2400*t)*np.exp(-t*200)
def impact():
    n=int(SR*3.5); t=np.arange(n)/SR
    f=30+90*np.exp(-t*6); s=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*1.1)
    nz=lpf(rng.standard_normal(n),1800)*np.exp(-t*3.5)*0.5
    return np.tanh((s+nz)*1.4)
def whoosh(d=0.7):
    n=int(SR*d); t=np.arange(n)/SR; x=rng.standard_normal(n)
    e=np.sin(np.pi*t/d)**2
    # sweep via chunks
    out=np.zeros(n); seg=1024
    for i in range(0,n,seg):
        k=i/n; c=600+6000*np.sin(np.pi*k)
        out[i:i+seg]=lpf(x[i:i+seg],c) if False else x[i:i+seg]
    out=hpf(lpf(out,3500),300)
    return out*e*.5
def riser(d):
    n=int(SR*d); t=np.arange(n)/SR; x=hpf(rng.standard_normal(n),800)
    e=(t/d)**2.5
    tone=np.sin(2*np.pi*np.cumsum(200+600*(t/d)**2)/SR)*0.15
    return (x*0.35+tone)*e
# --- harmony
CH={'Am':[57,60,64],'F':[53,57,60],'C':[48,55,60,64],'G':[55,59,62],'Em':[52,55,59]}
ROOT={'Am':45,'F':41,'C':48,'G':43,'Em':40}
PROG=['Am','F','C','G']
def chord_at(t): return PROG[int(t//2)%4]
def pad(ch,d,cut=1200):
    n=int(SR*d); s=np.zeros(n)
    for m in CH[ch]+[CH[ch][0]+12]:
        for det in (-.004,0,.0045): s+=saw(nf(m),n,det)
    s=lpf(s/12,cut); t=np.arange(n)/SR
    e=np.minimum(1,t/.6)*np.minimum(1,(d-t)/.5); return s*e
def bass(m,d):
    n=int(SR*d); t=np.arange(n)/SR
    s=saw(nf(m),n)+0.6*np.sin(2*np.pi*nf(m-12)*t)
    return lpf(s,500)*np.exp(-t*3)*np.minimum(1,t/.004)*.6
def pluck(m,d=.3):
    n=int(SR*d); t=np.arange(n)/SR
    s=(np.sign(np.sin(2*np.pi*nf(m)*t))*.5+saw(nf(m),n,.003)*.5)
    return lpf(s,2600)*np.exp(-t*9)*np.minimum(1,t/.002)
# INTRO 0-6.15
for bar in range(3):
    add(pad('Am' if bar!=1 else 'F',2.2,700),bar*2,0.22)
for i in range(int(6/0.25)):
    t=i*0.25; add(tick(),t,0.10 if i%2 else 0.16,0.3 if i%2 else -0.3)
for t in (0.35,1.5,2.5,3.5,4.5):
    add(kick(),t,0.55); add(lpf(rng.standard_normal(int(SR*.4)),600)*np.exp(-np.arange(int(SR*.4))/SR*9),t,0.25)
add(riser(1.7),4.45,0.55)
# LOGO
add(impact(),6.15,0.9); add(clap(),6.15,0.35)
add(pad('Am',4.0,1500),6.15,0.30)
arp=[57,60,64,69,64,60]
for i in range(int(3.8/0.25)):
    t=6.25+i*0.25; add(pluck(arp[i%6]+12,.35),t,0.10*min(1,i/6),(-.4,.4)[i%2])
add(riser(1.0),9.0,0.35)
# GROOVE 10-40
for bar in range(15):
    t0=10+bar*2; ch=chord_at(t0)
    add(pad(ch,2.15,1800),t0,0.20)
    for b in range(4):
        tb=t0+b*.5
        add(kick(),tb,0.75)
        if b in (1,3): add(clap(),tb,0.32)
        for s in range(4):
            th=tb+s*.125; add(hat(open_=(s==2)),th,(0.05 if s==2 else 0.03)+(0.015 if s%2 else 0),(.25 if s%2 else -.1))
        # bass offbeat 8ths
        for e in range(2): add(bass(ROOT[ch] if e==0 else ROOT[ch]+12, .24),tb+e*.25,0.55 if e==0 else 0.35)
    # arp 16ths
    notes=CH[ch]+[CH[ch][0]+12]
    pat=[0,1,2,3,2,1,3,2]
    for s in range(16):
        add(pluck(notes[pat[s%8]]+12,.28),t0+s*.125,0.085,(-.5,.5)[s%2])
# drop before scene switches / whooshes
for c in (10,18,24,32,36,40):
    add(whoosh(.75),c-0.5,0.55,-0.2); 
for c in (18,24,32,36): add(kick(True),c,0.25)
add(riser(1.6),38.4,0.45)
# OUTRO 40-46
add(impact(),40.0,1.0); add(kick(True),40.0,0.6)
ndur=6.0
add(pad('Am',ndur,2200),40.0,0.32)
for i,m in enumerate([69,72,76,81]):
    add(pluck(m+12,1.5),40.15+i*.18,0.12,(-.3,.3)[i%2])
for i in range(8):
    add(pluck([81,76,72,69][i%4]+12,.5),42.2+i*.5,0.05*(1-i/8),(-.5,.5)[i%2])
# --- reverb (FFT convolution)
def reverb(x,dec=1.8):
    n=int(SR*dec); t=np.arange(n)/SR; ir=rng.standard_normal(n)*np.exp(-t*4/dec); ir=lpf(ir,5000); ir/=np.sqrt((ir**2).sum())
    m=len(x)+n; F=1<<int(np.ceil(np.log2(m)))
    y=np.fft.irfft(np.fft.rfft(x,F)*np.fft.rfft(ir,F),F)[:len(x)]; return y
wetL=reverb(L); wetR=reverb(R)
L2=L+0.22*wetL; R2=R+0.22*wetR
# master: fade out, soft clip, normalize
t=np.arange(N)/SR; fade=np.clip((46-t)/1.2,0,1); fin=np.clip(t/0.05,0,1)
M=np.stack([L2,R2],1)*(fade*fin)[:,None]
M=np.tanh(M/np.max(np.abs(M))*1.2)/np.tanh(1.2)*0.89
with wave.open('music.wav','wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((M*32767).astype(np.int16).tobytes())
print('ok')
