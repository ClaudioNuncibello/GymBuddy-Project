# Guida al Deploy in Produzione (VPS) per GymBuddy

Questo documento spiega passo passo come portare il progetto **GymBuddy** da un ambiente locale a un **server remoto VPS** (es. Contabo, Hetzner, DigitalOcean) raggiungibile dal mondo esterno.

---

## 1. Prerequisiti della Macchina Host (VPS)
Assicurati che sulla tua VPS sia installato un sistema Linux moderno (raccomandato **Ubuntu 20.04 / 22.04 LTS**).
Prima di tutto, procedi ad aggiornare i repository di sistema ed installare il blocco Docker:

```bash
# Aggiorna i pacchetti
sudo apt update && sudo apt upgrade -y

# Installa le dipendenze fondamentali (Git, Curl, Unzip)
sudo apt install git curl unzip certbot -y

# Installa Docker e Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo rm get-docker.sh
```

## 2. Esportazione del Progetto sulla VPS

Hai due modalità per portare il codice GymBuddy sul tuo server VPS:

**A. Tramite Git (Metodo Consigliato)**
Se hai caricato il progetto GitHub in una repository privata, puoi clonarlo:
```bash
# Sulla tua VPS
mkdir -p /opt/gymbuddy_app
cd /opt/gymbuddy_app
git clone https://github.com/TuoNome/TuaRepoGymBuddy.git .
```

**B. Tramite SCP / SFTP**
Se non usi GitHub, puoi estrarre il progetto come `.zip` (senza i node_modules), inviarlo via SCP dal tuo computer e decomprimerlo.
```bash
# Comando dal tuo MAC/PC:
scp gymbuddy_archive.zip root@VOSTRO_IP_VPS:/opt/
```
```bash
# Sulla tua VPS, decomprimilo:
cd /opt
unzip gymbuddy_archive.zip -d gymbuddy_app
cd gymbuddy_app
```

---

## 3. Configurazione Ambientale (.env)

GymBuddy necessita delle variabili d'ambiente per potersi collegare in maniera sicura ed isolata al Database.
Usa il file di *template* fornito e creane uno valido:

```bash
# Trovandoti nella cartella root del progetto GymBuddy
cp .env.example .env
nano .env   # (apre un editor di testo testuale)
```

**Parametri Obbligatori da modificare dentro `.env`:**
- `SECRET_KEY`: *deve* essere una stringa lunga random (es. generala con `openssl rand -hex 32` sul terminale)
- `ADMIN_DEFAULT_PASSWORD`: Impostare qui la password iniziale *vera* e forte che avrà il tuo account capo.
- `FPS_IP` o `DOMAIN_NAME`: Scrivi l'IP della tua VPS e il nome a dominio `gymbuddy.it` (se lo possiedi).

Salva il file `.env` (con Nano si salva usano `Ctrl+O`, premi `INVIO` e poi `Ctrl+X` per uscire).

---

## 4. Build e Avvio dell'Infrastruttura

La repo GymBuddy contiene un file `docker-compose.yml` già restrittivo (con Resource Limits) e ottimizzato (Reverse Proxy Nginx mappato ed esposto in porta esterna `80` locale). 

Per avvalerti dei tuoi servizi e farli partire in background (`-d` = Detached):
```bash
docker compose up -d --build
```
> *Nota: Il primissimo build potrebbe durare molti minuti poiché NodeJS ed Alpine (FastAPI) scaricano ed incapsulano le dipendenze deterministiche (tramite `npm ci` e `pip install`).*

A processo finito, digita `docker compose ps` per verificare che i container (`app-nginx`, `app-backend`, `app-frontend`, `app-db`) indichino lo status esatto "Up". Da questo momento, se navighi l'IP pubblico del VPS dal browser: `http://TUO_IP_VPS`, vedrai l'app live!

---

## 5. Attivazione di SSL / HTTPS (Certbot)

Per abilitare il traffico sicuro con lucchetto `https://` sul tuo dominio `gymbuddy.com`:

### Passo 5.1: Associa il DNS
Punta l'IP Pubblico della VPS al **Record A** del pannello DNS dove hai comprato il dominio. Attendi 10 minuti per la propagazione.

### Passo 5.2: Fai emettere un certificato provvisorio (Host Level)
Fermiamo momentanemente `app-nginx` per fargli rilasciare la porta 80 e avviamo Certbot standalone.
```bash
docker compose stop nginx
sudo certbot certonly --standalone -d gymbuddy.com -d www.gymbuddy.com
```
*Se va a buon fine, Certbot salverà un file su `/etc/letsencrypt/live/gymbuddy.com/fullchain.pem`.*

### Passo 5.3: Dis-commenta il file `nginx.conf`
Adesso modifichiamo il proxy interno docker affinché legga i certificati ottenuti dall'host VPS.
Apri il file `nginx.conf` del progetto:
```bash
nano nginx.conf
```
* Rimuovi il carattere `#` su tutte le clausole del blocco **CONFIGURAZIONE SSL/HTTPS**, ossia de-commenta le diciture `listen 443 ssl;` e relativi percorsi.
* Assicurati di rinominare visivamente `/etc/letsencrypt/live/dominio.it/..` in base al `/etc/letsencrypt/live/gymbuddy.com/..` generato per il tuo Dominio.
* **Importante**: Mappa il path crittografico al container! Modifica il `docker-compose.yml` alla voce nginx aggiungendo i *volumes* verso l'host:
  ```yaml
      volumes:
        - ./nginx.conf:/etc/nginx/nginx.conf:ro
        - static_volume:/app/static
        - /etc/letsencrypt:/etc/letsencrypt:ro  # <--- NUOVO
  ```

### Passo 5.4: Riavvio finale
Riavvia NGINX per esporre all'esterno finalmente la porta messa in sicurezza (la 443):
```bash
docker compose up -d --force-recreate nginx
```

Hai Concluso! 🎉 Naviga all'indirizzo registrato col tuo certificato per gestire gli allenamenti sicuri per gli Atleti GymBuddy.
