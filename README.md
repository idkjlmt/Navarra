# Navarra Biblia

A Vox Dei Navarra Biblia landing oldalának önálló projektje.

## Tartalom

- Reszponzív landing oldal asztali és mobilos hero képpel.
- Közösségi ársávok, támogatás és az EWTN Shopra mutató rendelési hivatkozások.
- 121 oldalas, lapozható Máté mintakötet és letölthető PDF.
- VoxDei alkalmazásbemutató és letöltési QR-kódok.

## Helyi megnyitás

Nincs telepítési vagy build lépés. A projekt gyökerében:

```sh
python -m http.server 8080 --directory dist
```

Az oldal a `http://localhost:8080/` címen nyitható meg.

## Fájlok és közzététel

A teljes statikus weboldal a `dist/` mappában található. Statikus tárhelyen ezt kell kiszolgálni; a belépési pont `dist/index.html`. A relatív hivatkozások miatt az oldal külön alkönyvtárba, például `/navarra-biblia/` alá is telepíthető.

- `index.html`: tartalom és képhivatkozások.
- `styles.css`, `voxdei-chrome.css`, `responsive.css`: megjelenés.
- `app.js`: lapozó és kezelőfelületek.
- `assets/`: a használt képek, QR-kódok, PDF és a lapozó 121 oldalképe.

Az önálló másolat alapja a korábbi közös repó `408f8abca5f75df903e1626328cb66d04ad6a8cb` állapotának Navarra aloldala. A weboldal fájljai változatlanul kerültek át; a nem használt képek és a Napi Ige fájljai kimaradtak.

A korábbi közös projekt tárhely-azonosítója szándékosan nem része ennek a repónak. A repó létrehozása önmagában nem változtatja meg a meglévő élő oldal címét vagy tárhelyét.

## Támogatószámláló bekötése

A Közösségi kiadás szakasz a támogatók számát, a Támogatás szakasz az összegyűlt támogatást mutatja. Adatkapcsolat nélkül mindkettő gondolatjelet és „hamarosan elérhető” állapotot mutat, nem nullát vagy mintaadatot. A bekötéshez az `index.html` fájl `#supporterCounter` elemén töltsd ki a `data-endpoint` értékét a tényleges, nyilvánosan olvasható JSON-végpont URL-jével.

Elvárt válaszformátum: `{"supporterCount": 1234, "donationTotalHuf": 12345678}`. Mindkét mező kötelező, nem negatív, biztonságosan ábrázolható egész JavaScript-szám. A `donationTotalHuf` egész forintban értendő. Ez a példa nem valós támogatói adat. Egy közös lekérés frissíti mindkét kijelzőt; hibás vagy hiányzó mező esetén egyik értéket sem írja felül.

A végpont külön mezőben adja a támogatók számát és a támogatások összegét. A belső rendszerben kell meghatározni az egyedi támogatók számolását. Csak összesített adat kerüljön a nyilvános válaszba, személyes adat ne. A belső rendszer hitelesítését szerveroldali átjáró végezze; API-kulcsot vagy belső belépési adatot tilos a weboldalba tenni. Más domain esetén megfelelő CORS-beállítás szükséges.

A számláló az oldal megnyitásakor és látható böngészőlapon 60 másodpercenként frissül. A kérés 10 másodperc után megszakad. Hibánál az utolsó sikeres érték megmarad, jól látható állapotjelzéssel. A kijelzett frissítési idő a sikeres lekérés ideje. A funkció külön `supporters.js` fájlban van, a számjegyformátum és a mobilos megjelenés a `supporters.css` fájlban.
