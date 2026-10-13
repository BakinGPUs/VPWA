# YAP!

chat appka na VPWA

spustenie:
```
npm install
npm run dev
```
login: `jozko@stuba.sk` (alebo nick `jozko`) / `heslo123`

všetky dáta sú statické v `src/store.js`, po refreshi sa všetko resetne

### Podporované príkazy v príkazovom riadku:
- `/join channelName [private]` – pripojenie do existujúceho kanála alebo vytvorenie nového (verejný/súkromný)
- `/invite nickName` – pozvanie používateľa do kanála (v private kanáli iba správca, zrušenie banu správcom)
- `/revoke nickName` – odobratie používateľa zo súkromného kanála (iba správca)
- `/kick nickName` – vyhodenie z verejného kanála (správca ihneď udelí ban, bežní členovia hlasujú: 3 unikátne hlasy = trvalý ban)
- `/list` – zoznam členov aktuálneho kanála (otvorí aj bočný panel členov)
- `/cancel` – zrušenie členstva v kanáli (ak odíde správca, kanál zaniká)
- `/quit` – zrušenie kanála správcom

### Funkcionality a funkcie:
- **Používateľské stavy**: Online, DND (nerušiť - bez notifikácií), Offline (správy sa nezobrazujú, po prepnutí do online sa kanály automaticky aktualizujú).
- **Notifikácie**:
  - Vystavujú sa iba v prípade, ak aplikácia nie je v stave visible (`$q.appVisible`).
  - Obsahujú odosielateľa a časť textu správy.
  - Nastavenie pre notifikácie iba správ adresovaných používateľovi (`@nick`).
  - Tlačidlo *"Test notifikácie (5s)"* v hlavičke odošle testovaciu správu po 5 sekundách (umožňuje prepnúť kartu a otestovať správanie).
- **Písanie v reálnom čase**:
  - V stavovej lište sa zobrazuje informácia o tom, kto aktuálne píše správu (napr. *ed píše správu...*).
  - Po kliknutí na nick sa otvorí živý dialóg s náhľadom rozpísaného textu v reálnom čase.
- **Dátový model UML**:
  - Nachádza sa v `docs/datovy-model.puml` a `docs/datovy-model.png`.
