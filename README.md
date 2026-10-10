# TAFITA MADA Learn 🇲🇬📱

> **« Mianara anio, tafita rahampitso »**  
> Sehatra fanabeazana nomerika sy vondrom-piarahamonina ho an'ny mpianatra, mpampianatra, ary ray aman-dreny (RAD) eto Madagasikara.

---

## 📖 Famintinana ny tetikasa (Présentation du projet)

**TAFITA MADA Learn** dia rindranasa fanabeazana (Application web & Android) mampifandray mivantana amin'ny tahirin-kevitra Supabase (`szxficncfyvghhxqzlnp`) :
- **Fampianarana sy lesona tena izy :** Fandaharam-pianarana Malagasy (Série L, A1, A2, S, C, D, OSE).
- **Vondrona sy fifaneraserana :** Resaka anatiny sy rohy ivelany (Facebook, WhatsApp, Telegram).
- **Rakibolana :** Famaritana teny malagasy sy dikany.
- **Boky sy tahiry :** Boky nomerika sy fitaovana fianarana.
- **Fitantanana kaonty sy andraikitra :** Mpianatra, Mpampianatra, RAD, Admin miaraka amin'ny fiarovana Row Level Security (RLS).

---

## 🛠️ Firafitry ny haitao (Architecture technique)

- **Frontend :** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Mobile Runtime :** Capacitor 8 (Android WebView miaraka amin'ny fifandraisana HTTPS sy Row Level Security).
- **Backend :** Supabase Backend (`https://szxficncfyvghhxqzlnp.supabase.co`).
- **Application ID :** `mg.tafitamada.learn`
- **Application Name :** `TAFITA MADA Learn`

---

## 📱 Torolalana ho an'ny fampidinana ny APK amin'ny finday (Guide pas-à-pas depuis un téléphone Android)

Raha miasa avy amin'ny finday Android ianao ka tsy manana solosaina misy Android Studio na Java, ity misy fomba tsotra sy haingana indrindra ahazoana ny **APK azo apetraka (Installable APK)** amin'ny alalan'ny **GitHub Actions** :

### Dingana 1 : Ampidiro ao amin'ny GitHub ny tetikasa (Mettre le code sur GitHub)
1. Sokafy ny tranokala **[github.com](https://github.com)** amin'ny navigateur-n'ny findainao (Chrome na Firefox).
2. Mamorona tahiry vaovao (**New Repository**) antsoina hoe `tafita-mada-learn`.
3. Alefaso (Push na Upload) ny rakitra rehetra amin'ny alalan'ny Git na ny interface web an'ny GitHub.

### Dingana 2 : Famaritana ny Secrets GitHub (Safidy / Optionnel)
Ny workflow dia efa manana ny sandany voafaritra mialoha ho an'ny tetikasa Supabase. Raha manana fanalahidy manokana tianao hampiasaina ianao :
1. Ao amin'ny pejin'ny repo-nao ao amin'ny GitHub, tsindrio ny **Settings** (Paramètres).
2. Tsindrio ny **Secrets and variables** ➔ **Actions**.
3. Tsindrio ny **New repository secret** :
   - Anarana : `VITE_SUPABASE_URL` ➔ Sandany : `https://szxficncfyvghhxqzlnp.supabase.co`
   - Anarana : `VITE_SUPABASE_ANON_KEY` ➔ Sandany : ny fanalahidy `anon` azo antoka avy amin'ny Supabase.

### Dingana 3 : Fandefasana ny fanamboarana APK (Lancer la compilation)
1. Ao amin'ny GitHub, tsindrio ny kihebaheba **Actions**.
2. Tsindrio ny workflow **Build Android APK (TAFITA MADA Learn)**.
3. Tsindrio ny bokotra **Run workflow** ➔ **Run workflow**.
4. Miandrasa eo amin'ny 2 hatramin'ny 4 minitra. Rehefa vita soa aman-tsara ny fanamboarana dia ho lasa maitso misy marika (✔️).

### Dingana 4 : Fampidinana sy fametrahana ny APK (Téléchargement et Installation)
1. Tsindrio ilay workflow vao vita (ilay misy marika maitso).
2. Midina any amin'ny farany ambany amin'ny pejy, eo amin'ny fizarana **Artifacts**.
3. Tsindrio ny rohy **`tafita-mada-learn-debug-apk`** mba hampidinana ilay rakitra `.zip`.
4. Sokafy amin'ny mpitantana rakitra (Gestionnaire de fichiers / Fichiers) amin'ny findainao ilay `.zip`, ary avoahy (Extraire) ilay rakitra `.apk`.
5. Tsindrio ilay `.apk` mba hametrahana azy amin'ny finday.  
   *(Raha manontany ny finday dia ekeo ny « Autoriser l'installation d'applications de sources inconnues »).*

---

## 💻 Kaody sy baiko eo an-toerana (Commandes locales)

Raha miasa amin'ny solosaina ianao :

```bash
# 1. Fametrahana ireo fonosana (Installer les dépendances)
npm install

# 2. Fitsapana eo amin'ny navigateur (Lancer en développement)
npm run dev

# 3. Fanamboarana ny tranonkala (Build production Vite)
npm run build

# 4. Fampitoviana ny rakitra amin'ny Android (Capacitor Sync)
npm run cap:sync

# 5. Fanokafana ao amin'ny Android Studio
npx cap open android
```

---

## 🔒 Fiarovana sy tsiambaratelo (Sécurité)

- **Tsy misy fanalahidy miafina (`service_role`) :** Ny client sy ny APK dia mampiasa fotsiny ny fanalahidy `anon` ampahibemaso voaaro amin'ny alalan'ny politikan'ny **Row Level Security (RLS)** ao amin'ny Supabase.
- Ny rakitra `.env` rehetra dia voasakana tsy hiditra ao amin'ny Git amin'ny alalan'ny `.gitignore`.
