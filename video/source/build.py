import json,os
s=open('v/film.src.html').read()
s=s.replace('__LOGO__',open('logo.json').read()).replace('__FOOTN__',str(len(os.listdir('v/f'))))
open('v/film.html','w').write(s)
