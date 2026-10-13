# Configuration Pare-feu (Firewall) - L0-05

Ce document décrit les règles de pare-feu requises au niveau de l'hôte pour l'infrastructure TAKT.

## Règles Entrantes (Ingress)

| Port | Protocole | Source | Destination | Description |
|------|-----------|--------|-------------|-------------|
| 443 | TCP | Réseau interne (ex: 10.0.0.0/8, 192.168.0.0/16) | Hôte Docker | HTTPS - Point d'entrée unique via Nginx |
| 80 | TCP | Réseau interne | Hôte Docker | HTTP -> Redirect vers HTTPS (optionnel) |
| 22 | TCP | Réseau admin (bastion/VPN) | Hôte Docker | SSH administration |

## Règles Sortantes (Egress)

| Port | Protocole | Source | Destination | Description |
|------|-----------|--------|-------------|-------------|
| 587 | TCP | Conteneur API (réseau smtp) | `cck.rnu.tn` | SMTP STARTTLS (seule sortie autorisée pour l'API) |
| 465 | TCP | Conteneur API (réseau smtp) | `cck.rnu.tn` | SMTP SSL (alternative) |
| 53 | UDP/TCP | Tous conteneurs | DNS interne/résolveur | Résolution DNS |
| 123 | UDP | Hôte Docker | NTP | Synchronisation horaire |

## Réseaux Docker (Isolation)

```yaml
networks:
  frontend:     # Nginx ↔ Web (port 3000)
    driver: bridge
    internal: false  # Port 443/80 exposés
  
  backend:      # Nginx ↔ API ↔ Worker ↔ PostgreSQL ↔ pg-boss
    driver: bridge
    internal: true   # Aucune exposition externe
  
  smtp:         # API → SMTP externe (seule sortie)
    driver: bridge
    internal: false  # Autorise sortie vers cck.rnu.tn:587
  
  observability: # Prometheus, Grafana, Loki, Tempo
    driver: bridge
    internal: true   # Monitoring interne uniquement
```

## Mise en œuvre recommandée

### Ubuntu/Debian (ufw)
```bash
# Politique par défaut
ufw default deny incoming
ufw default allow outgoing

# Réseau interne (ajuster selon votre CIDR)
ufw allow from 10.0.0.0/8 to any port 443 proto tcp
ufw allow from 192.168.0.0/16 to any port 443 proto tcp

# Administration (bastion/VPN uniquement)
ufw allow from <BASTION_IP> to any port 22 proto tcp

# Activer
ufw enable
```

### RHEL/CentOS/Fedora (firewalld)
```bash
# Zone interne
firewall-cmd --permanent --zone=internal --add-source=10.0.0.0/8
firewall-cmd --permanent --zone=internal --add-source=192.168.0.0/16
firewall-cmd --permanent --zone=internal --add-port=443/tcp
firewall-cmd --permanent --zone=internal --add-port=80/tcp

# Zone admin (SSH)
firewall-cmd --permanent --zone=admin --add-source=<BASTION_IP>
firewall-cmd --permanent --zone=admin --add-port=22/tcp

# Activer
firewall-cmd --reload
```

### iptables (basique)
```bash
# Flush
iptables -F
iptables -X

# Politique par défaut
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Loopback
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Established/Related
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# HTTPS depuis réseau interne
iptables -A INPUT -s 10.0.0.0/8 -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -s 192.168.0.0/16 -p tcp --dport 443 -j ACCEPT

# HTTP redirect
iptables -A INPUT -s 10.0.0.0/8 -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -s 192.168.0.0/16 -p tcp --dport 80 -j ACCEPT

# SSH admin
iptables -A INPUT -s <BASTION_IP> -p tcp --dport 22 -j ACCEPT

# DNS
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT

# NTP
iptables -A OUTPUT -p udp --dport 123 -j ACCEPT

# SMTP sortant (depuis réseau docker smtp uniquement)
# Note: Docker gère le NAT, cette règle est sur l'hôte pour le trafic conteneur
iptables -A OUTPUT -p tcp -d cck.rnu.tn --dport 587 -j ACCEPT
iptables -A OUTPUT -p tcp -d cck.rnu.tn --dport 465 -j ACCEPT
```

## Vérification

```bash
# Vérifier les ports ouverts
ss -tlnp | grep -E ':80|:443|:22'

# Vérifier la connectivité SMTP depuis le conteneur API
docker exec takt-api nc -zv cck.rnu.tn 587

# Vérifier l'isolation réseau
docker network inspect takt-backend | grep -A5 "Internal"
docker network inspect takt-smtp | grep -A5 "Internal"
```

## Notes de sécurité

1. **Seul Nginx (port 443) est exposé** sur le réseau interne
2. **L'API n'a qu'une route sortante** : vers `cck.rnu.tn` port 587/465 via le réseau `smtp`
3. **Le Worker n'a AUCUNE route sortante** (réseau `backend` en `internal: true`)
4. **La base de données n'est accessible** que depuis le réseau `backend`
5. **Les certificats TLS** sont gérés par Certbot (Let's Encrypt) en production
6. **Rate limiting** appliqué au niveau Nginx (voir `nginx.conf`)