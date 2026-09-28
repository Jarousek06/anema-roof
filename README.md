# ANEMA ROOF — web

Statický web pro ANEMA ROOF (jiskrové a jehlové zkoušky plochých střech).
Bez build kroku — čisté HTML + CSS + JS. Stačí nahrát složku.

## Struktura

```
anema-roof/
├── index.html            jednostránkový web
├── dekujeme.html         potvrzení po odeslání formuláře
├── ochrana-udaju.html    GDPR — KONCEPT, nutno doplnit
├── 404.html
├── robots.txt / sitemap.xml / favicon.ico
└── assets/
    ├── css/style.css     design systém (tmavý cinematic, brand černá/červená)
    ├── fonts/            self-hostované Archivo + Inter (woff2, latin + latin-ext)
    ├── js/hero-fx.js     WebGL vrstva v hero — 3D membrána + jiskrový scan
    ├── js/main.js        navigace, reveal animace, 3D tilt, parallax, akční lišta
    └── img/              fotky (WebP, 2 velikosti), logo, og-image
```

## Lokální spuštění

```bash
npx serve anema-roof -l 5177
```

## Nasazení

**Netlify Drop:** přetáhnout složku `anema-roof` na https://app.netlify.com/drop

Formulář je připravený pro **Netlify Forms** (`data-netlify="true"`, honeypot
`firma-web`, po odeslání redirect na `/dekujeme.html`). Poptávky najdete
v administraci pod *Forms → poptavka*, notifikace na e-mail se nastaví
tamtéž pod *Form notifications*.

Poběží-li web jinde než na Netlify, je potřeba formulář přesměrovat —
např. změnit `action` na Formspree endpoint a odstranit `data-netlify`.

---

## ⚠️ NEŽ WEB PUSTÍTE VEN

Tyhle věci **musí** doplnit ANEMA, jinak web není kompletní:

| Co | Kde | Proč |
|---|---|---|
| Ostrá doména | `index.html` — `canonical`, `og:url`, `og:image`; `robots.txt`; `sitemap.xml` | Teď je všude placeholder `www.anema.cz`. Bez opravy se nezobrazí náhled na sociálních sítích. |
| IČO, DIČ, sídlo, obchodní jméno | patička `index.html` (označeno `TODO`) | Zákonná povinnost (§ 435 obč. zák.). |
| GDPR text | `ochrana-udaju.html` | Je to **koncept** s viditelnými `[doplnit]`. Musí projít někým, kdo za to ručí. |
| Region působnosti | FAQ + text | Nejčastější dotaz u lokální služby, zatím není nikde. |
| Orientační cena a rychlost | FAQ „Kolik kontrola stojí" | Bez toho spousta lidí poptávku nepošle. |
| Typy hydroizolace (PVC, TPO, EPDM, asfalt) | FAQ | Neznáme rozsah, proto zatím neuvádíme. |

## Co webu pořád chybí (a stálo by za to doplnit)

Není to blokující, ale posunulo by to výsledky:

- **Reference a čísla** — kolik m² zkontrolováno, kolik let praxe, pro koho.
  U B2B služby to hledá nakupující jako první.
- **Ukázka protokolu** — náhled 1–2 stran výstupu, klidně anonymizovaně.
  Nejsilnější prvek důvěry, jaký pro tuhle službu existuje.
- **Reálné fotky ze zakázek.** Stávající fotky jsou v původním PDF označené jako
  „ilustrační vizualizace". Pokud nejsou z reálných akcí, popisek „ilustrační"
  je potřeba držet konzistentně u všech, ne jen u jedné.
- **Odstavec o firmě** — kdo jste, vybavení (např. DRY ROOF PRO 2 z fotek).
- **Analytika** (Plausible / GA4). Pozor: s analytikou je nutné přepsat
  odstavec o cookies v `ochrana-udaju.html` a doplnit cookie lištu.

## Technické poznámky

- Fonty jsou **self-hostované** — žádné volání na Google CDN (rychlost + GDPR).
- WebGL vrstva v hero se pauzuje mimo viewport a při skryté záložce,
  respektuje `prefers-reduced-motion` a při chybějící podpoře se skryje.
- Ověřeno bez horizontálního scrollu a s tap targety ≥ 44 px
  na šířkách 320 / 360 / 390 / 414 / 768 / 1024 / 1280 / 1440 px
  a v režimu na šířku.
- Pozn. pro úpravy: `.reveal.is-in` řídí odhalovací animaci a **nikdy se neodebírá**.
  Aktivní krok v postupu má vlastní třídu `.step.is-active`.
