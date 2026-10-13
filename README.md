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
