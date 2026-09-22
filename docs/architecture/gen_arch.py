"""AquaWise system architecture — hand-laid SVG, 1920x1080 (16:9)."""
W, H = 1920, 1080
C = dict(primary='#0A5DA8', pdark='#084A87', psub='#E7F1FB', pbord='#B9D4EE', teal='#0E7C86', tdark='#0B5F67', tsub='#E3F4F5', tbord='#A9D8DC',
         green='#1E7F4F', gdark='#155D38', gsub='#E6F4EC', gbord='#B7DEC8', hero='#0B3B66', ink='#0F1B2A', body='#344456', muted='#5B6B7E',
         border='#D5DEE8', surface='#F4F8FC', white='#FFFFFF', accent='#1BB3CF', danger='#C62828')
FONT = "Inter, 'Segoe UI', Arial, sans-serif"
HFONT = "Manrope, Inter, 'Segoe UI', Arial, sans-serif"
o = []
P = o.append

def esc(s): return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
def text(x, y, s, size=17, weight=400, fill=C['body'], anchor='start', family=FONT, italic=False, halo=False):
    st = ' font-style="italic"' if italic else ''
    h = f' paint-order="stroke" stroke="{C["white"]}" stroke-width="6" stroke-linejoin="round"' if halo else ''
    P(f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{st}{h}>{esc(s)}</text>')
def lines(x, y, arr, size=17, gap=None, **kw):
    gap = gap or size * 1.3
    for i, s in enumerate(arr): text(x, y + i * gap, s, size, **kw)
def rect(x, y, w, h, fill, stroke, r=12, sw=1.5, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    P(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')
def box(x, y, w, h, title, sub=None, tone='p', filled=False, tsize=20, ssize=16):
    fills = {'p': (C['psub'], C['pbord'], C['pdark']), 't': (C['tsub'], C['tbord'], C['tdark']), 'g': (C['gsub'], C['gbord'], C['gdark']), 'w': (C['white'], C['border'], C['ink'])}
    f, s, tc = fills[tone]
    if filled: f, s, tc = C['primary'], C['primary'], C['white']
    rect(x, y, w, h, f, s, 10)
    if sub:
        text(x + w / 2, y + h / 2 - 3, title, tsize, 700, tc, 'middle', HFONT)
        text(x + w / 2, y + h / 2 + ssize + 3, sub, ssize, 400, C['white'] if filled else C['body'], 'middle')
    else:
        text(x + w / 2, y + h / 2 + tsize * 0.35, title, tsize, 700, tc, 'middle', HFONT)
def arrow(x1, y1, x2, y2, color=C['ink'], dash=None, sw=3, head=True, both=False):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    m = ' marker-end="url(#ah)"' if head else ''
    ms = ' marker-start="url(#ahs)"' if both else ''
    P(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{sw}"{d}{m}{ms}/>')
def path(d, color=C['ink'], dash=None, sw=3, head=True):
    ds = f' stroke-dasharray="{dash}"' if dash else ''
    m = ' marker-end="url(#ah)"' if head else ''
    P(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{sw}"{ds}{m} stroke-linejoin="round"/>')
def step(x, y, n, color=C['accent']):
    P(f'<circle cx="{x}" cy="{y}" r="17" fill="{C["hero"]}" stroke="{C["white"]}" stroke-width="3"/>')
    text(x, y + 6.5, str(n), 18, 800, C['white'], 'middle', HFONT)
def chip(x, y, label, icon_fill):
    w = 11 * len(label) + 44
    rect(x, y, w, 36, C['white'], C['border'], 18)
    P(f'<circle cx="{x + 20}" cy="{y + 18}" r="7" fill="{icon_fill}"/>')
    text(x + 36, y + 24, label, 16, 600, C['ink'])
    return w

P(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
P(f'''<defs>
<marker id="ah" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L12,6 L0,12 Z" fill="context-stroke"/></marker>
<marker id="ahs" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L12,6 L0,12 Z" fill="context-stroke"/></marker>
</defs>''')
P(f'<rect width="{W}" height="{H}" fill="{C["surface"]}"/>')

# ---------- Title ----------
P(f'<rect x="0" y="0" width="{W}" height="96" fill="{C["hero"]}"/>')
P(f'<rect x="40" y="26" width="44" height="44" rx="10" fill="{C["primary"]}"/>')
P(f'<path d="M62 34 C62 34 50 48 50 55 A12 12 0 0 0 74 55 C74 48 62 34 62 34 Z" fill="{C["white"]}"/>')
text(100, 58, 'AquaWise — System Architecture', 36, 800, C['white'], family=HFONT)
text(1880, 46, 'Three-tier MERN · session-based auth', 20, 600, '#D6E8F8', 'end')
text(1880, 74, 'React + Bootstrap  →  Node.js / Express REST API  →  MongoDB Atlas', 18, 400, '#9CC6EC', 'end')

# ---------- Tier panels ----------
T1 = (40, 560); T2 = (760, 1300); T3 = (1480, 1880)
TOP, BOT = 116, 900
for (x1, x2), num, name, col in [(T1, '1', 'CLIENT TIER', C['primary']), (T2, '2', 'APPLICATION TIER', C['teal']), (T3, '3', 'DATA TIER', C['green'])]:
    rect(x1, TOP, x2 - x1, BOT - TOP, C['white'], C['border'], 16, 2)
    P(f'<rect x="{x1}" y="{TOP}" width="{x2 - x1}" height="8" rx="4" fill="{col}"/>')
    text(x1 + 22, TOP + 44, f'TIER {num} · {name}', 22, 800, col, family=HFONT)

# ===== Tier 1: client =====
chip(62, 176, 'Hosted on Vercel · static CDN', C['ink'])
# CDN box
box(62, 226, 476, 50, 'Vercel Edge CDN', None, 'w', tsize=19)
# browser window
bx, by, bw, bh = 62, 330, 476, 550
rect(bx, by, bw, bh, C['white'], C['pbord'], 12, 2)
P(f'<path d="M{bx} {by + 12} a12 12 0 0 1 12 -12 h{bw - 24} a12 12 0 0 1 12 12 v34 h-{bw} z" fill="{C["psub"]}"/>')
for i, col in enumerate(['#E06C6C', '#F2B01E', '#3FB37F']):
    P(f'<circle cx="{bx + 22 + i * 20}" cy="{by + 23}" r="6" fill="{col}"/>')
rect(bx + 90, by + 10, 300, 26, C['white'], C['pbord'], 13, 1)
text(bx + 240, by + 29, 'Browser · aquawise.vercel.app', 15, 500, C['muted'], 'middle')
text(bx + 20, by + 80, 'React 18 SPA · Bootstrap 5.3', 21, 800, C['ink'], family=HFONT)
box(bx + 20, by + 100, 436, 72, 'API client', "fetch · credentials: 'include'", 'p', filled=True)
box(bx + 20, by + 186, 212, 64, 'AuthContext', 'user · role · society', 'p', tsize=18)
box(bx + 244, by + 186, 212, 64, 'React Router', '7 pages', 'p', tsize=18)
text(bx + 20, by + 286, 'Runs in the browser (no server needed)', 16, 600, C['tdark'])
box(bx + 20, by + 300, 436, 72, 'Calculator module', 'formulas.js v1.0 · litres, lpcd, band', 't')
box(bx + 20, by + 386, 436, 72, 'Advisory module', 'rule evaluator · 14 rules (cached)', 't')
text(bx + 20, by + 494, 'Bootstrap 5 UI components · aquawise.css theme', 16, 400, C['muted'])
text(bx + 20, by + 518, 'Guests get results with no server round trip', 16, 400, C['muted'])
# static asset arrow browser <-> CDN
arrow(150, 330, 150, 280, C['ink'], sw=3)
step(126, 305, 1)
text(170, 311, 'HTTPS GET → HTML, JS, CSS bundle', 17, 600, C['ink'], halo=True)

# ===== Tier 2: application =====
chip(782, 176, 'Hosted on Render · Node.js 20 web service', C['teal'])
ex, ey, ew, eh = 782, 226, 496, 654
rect(ex, ey, ew, eh, C['surface'], C['tbord'], 12, 2)
text(ex + 18, ey + 34, 'Express 4 REST API', 21, 800, C['ink'], family=HFONT)
# middleware pipeline
text(ex + 18, ey + 66, 'Middleware pipeline (in order)', 16, 600, C['tdark'])
mw1 = [('helmet', 'w'), ('cors', 'w'), ('express.json', 'w')]
mw2 = [('rate-limit', 'w'), ('express-session', 't')]
px = ex + 18
for i, (n, t) in enumerate(mw1):
    box(px + i * 158, ey + 78, 142, 44, n, None, t, tsize=17)
    if i < 2: arrow(px + i * 158 + 142, ey + 100, px + (i + 1) * 158, ey + 100, C['muted'], sw=2)
path(f'M{px + 2 * 158 + 71} {ey + 122} v10 H{px + 71} v10', C['muted'], sw=2)
box(px, ey + 144, 142, 44, 'rate-limit', None, 'w', tsize=17)
box(px + 158, ey + 144, 300, 44, 'express-session + connect-mongo', None, 't', tsize=16)
arrow(px + 142, ey + 166, px + 158, ey + 166, C['muted'], sw=2)
text(px, ey + 210, 'rate-limit applies to /api/auth/login (5 per 15 min)', 14.5, 400, C['muted'])
# routes
text(ex + 18, ey + 246, 'REST route groups · requireAuth / requireRole per route', 16, 600, C['tdark'])
routes = [('/api/auth', 'signup · login · logout · me'), ('/api/calculator', 'compute · save · history'),
          ('/api/advisory', 'rules · evaluate'), ('/api/societies', 'create · join · contacts · code'),
          ('/api/complaints', 'file · list · status · reopen'), ('/api/dashboard', 'counts by status')]
for i, (r, s) in enumerate(routes):
    cx = ex + 18 + (i % 2) * 234; cy = ey + 258 + (i // 2) * 70
    box(cx, cy, 224, 60, r, s, 'p', tsize=18, ssize=14.5)
# services
text(ex + 18, ey + 488, 'Services (pure functions)', 16, 600, C['tdark'])
for i, (n, s) in enumerate([('calculator', 'formulas.js'), ('advisory', 'rules.json'), ('routing', 'category→contact')]):
    box(ex + 18 + i * 156, ey + 498, 146, 58, n, s, 't', tsize=17, ssize=14)
arrow(ex + ew / 2, ey + 468, ex + ew / 2, ey + 494, C['muted'], sw=2)
# models
text(ex + 18, ey + 580, 'Mongoose models', 16, 600, C['tdark'])
for i, n in enumerate(['User', 'Society', 'Complaint', 'CalcLog']):
    box(ex + 18 + i * 116, ey + 590, 108, 46, n, None, 'g', tsize=17)
arrow(ex + ew / 2, ey + 558, ex + ew / 2, ey + 586, C['muted'], sw=2)

# ===== Tier 3: data =====
chip(1502, 176, 'MongoDB Atlas · M0 cluster', C['green'])
dx, dw = 1502, 356
# sessions collection box aligned with express-session
rect(dx, 350, dw, 90, C['gsub'], C['gbord'], 12, 2)
text(dx + 20, 385, 'sessions', 21, 800, C['gdark'], family=HFONT)
text(dx + 20, 414, 'TTL index on expires · 2 h', 16, 400, C['body'])
# database cylinder
cy0, cy1 = 500, 860
P(f'<path d="M{dx} {cy0 + 26} v{cy1 - cy0 - 52} a{dw / 2} 26 0 0 0 {dw} 0 v-{cy1 - cy0 - 52}" fill="{C["gsub"]}" stroke="{C["green"]}" stroke-width="2.5"/>')
P(f'<ellipse cx="{dx + dw / 2}" cy="{cy0 + 26}" rx="{dw / 2}" ry="26" fill="{C["white"]}" stroke="{C["green"]}" stroke-width="2.5"/>')
text(dx + dw / 2, cy0 + 34, 'aquawise database', 20, 800, C['gdark'], 'middle', HFONT)
for i, (n, s) in enumerate([('users', 'unique email'), ('societies', 'unique joinCode'), ('complaints', 'index society + status'), ('calculatorlogs', 'index user + date')]):
    yy = cy0 + 80 + i * 56
    rect(dx + 24, yy, dw - 48, 46, C['white'], C['gbord'], 8, 1.5)
    text(dx + 40, yy + 30, n, 18, 700, C['ink'], family=HFONT)
    text(dx + dw - 40, yy + 30, s, 15, 400, C['muted'], 'end')
text(dx + dw / 2, cy1 - 44, '3-node replica set · TLS · IP access list', 15, 500, C['gdark'], 'middle')

# ===== cross-tier arrows =====
# (2) API request / response between T1 API client and T2 middleware
ay_req, ay_res = by + 122, by + 152   # 452, 482
arrow(538, ay_req, ex + 8, ay_req, C['primary'], sw=4, head=False)
arrow(ex, ay_res, 538, ay_res, C['primary'], sw=4)
step(576, ay_req - 62, 2)
lines(600, ay_req - 56, ['HTTPS · REST/JSON', '+ session cookie'], 16.5, weight=700, fill=C['pdark'])
lines(578, ay_res + 28, ['JSON responses', 'Set-Cookie on login'], 17, weight=600, fill=C['pdark'])
lines(578, ay_res + 88, ['/api/* rewritten by Vercel', 'to Render: one origin,', 'cookie stays SameSite=Lax'], 14.5, weight=400, fill=C['muted'], italic=True)
# connect request into pipeline start
path(f'M{ex + 8} {ay_req} V{ey + 100} H{ex + 16}', C['primary'], sw=4)
# shared code dashed link (modules <-> services)
path(f'M{bx + 456} {by + 380} C 660 {by + 380}, 700 {ey + 527}, {ex + 18} {ey + 527}', C['teal'], dash='9 7', sw=3, head=False)
lines(598, by + 440, ['Same code, both sides:', 'shared/formulas.js,', 'shared/rules.json'], 15.5, weight=600, fill=C['tdark'])
# (3) session store
arrow(px + 458, ey + 166, dx, 395, C['teal'], sw=4)   # from session pill right to sessions box
step(1390, 330, 3)
lines(1318, 258, ['MongoDB wire', 'protocol · TLS', 'session read/write'], 16, weight=700, fill=C['tdark'])
# (4) models -> database
arrow(ex + ew, ey + 613, dx, ey + 613, C['green'], sw=4)
arrow(dx, ey + 640, ex + ew, ey + 640, C['green'], sw=4)
step(1390, ey + 574, 4)
lines(1318, ey + 452, ['Mongoose ODM', 'mongodb+srv://', 'over TLS', 'CRUD queries,', 'count by status'], 16, weight=700, fill=C['gdark'])
text(1390, ey + 676, 'BSON documents', 16, 600, C['gdark'], 'middle')

# ===== Bottom band: deployment + legend =====
BY = 920
rect(40, BY, 1840, 140, C['white'], C['border'], 16, 2)
text(62, BY + 36, 'DEPLOYMENT', 18, 800, C['hero'], family=HFONT)
box(62, BY + 54, 300, 66, 'GitHub monorepo', 'client/ · server/ · shared/', 'w', tsize=18, ssize=15)
arrow(362, BY + 76, 520, BY + 76, C['ink'], sw=3)
arrow(362, BY + 100, 520, BY + 100, C['ink'], sw=3)
text(441, BY + 68, 'git push', 15, 600, C['ink'], 'middle')
text(441, BY + 124, 'auto-deploy', 15, 600, C['ink'], 'middle')
box(526, BY + 50, 250, 34, 'client/ → Vercel', None, 'p', tsize=16)
box(526, BY + 90, 250, 34, 'server/ → Render', None, 't', tsize=16)
box(800, BY + 54, 420, 66, 'Render environment variables', 'MONGODB_URI · SESSION_SECRET · NODE_ENV', 'w', tsize=17, ssize=15)
box(1244, BY + 54, 250, 66, 'Postman collection', 'tests every /api route', 'w', tsize=17, ssize=15)
# legend
lx = 1520
text(lx, BY + 36, 'LEGEND', 18, 800, C['hero'], family=HFONT)
arrow(lx, BY + 62, lx + 60, BY + 62, C['primary'], sw=4); text(lx + 72, BY + 68, 'network call (HTTPS / TLS)', 15.5, 500, C['ink'])
path(f'M{lx} {BY + 92} H{lx + 60}', C['teal'], dash='9 7', sw=3, head=False); text(lx + 72, BY + 98, 'shared code, not a network call', 15.5, 500, C['ink'])
step(lx + 14, BY + 122, 1); text(lx + 40, BY + 128, 'request order in the talk', 15.5, 500, C['ink'])
P('</svg>')
open('/home/claude/arch/AquaWise_Architecture.svg', 'w').write('\n'.join(o))
print('svg ok')
