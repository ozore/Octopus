#!/usr/bin/env python3
import sys,re,html
h=open(sys.argv[1],encoding='utf-8',errors='ignore').read()
h=re.sub(r'<(script|style|nav|footer|svg)[^>]*>.*?</\1>','',h,flags=re.S|re.I)
h=re.sub(r'<br[^>]*>','\n',h,flags=re.I)
h=re.sub(r'</(p|div|li|tr|h1|h2|h3|h4|td)>','\n',h,flags=re.I)
t=html.unescape(re.sub(r'<[^>]+>',' ',h))
t=re.sub(r'[ \t]+',' ',t)
t=re.sub(r'\n\s*\n+','\n',t)
print(t.strip())
