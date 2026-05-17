#!/bin/bash
# ==============================================================================
# 🚀 O2OEG — HARDENED VPS PRODUCTION SETUP & TUNING SCRIPT
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS on Hostinger VPS
# WARNING: Run this script as root!
# ==============================================================================

set -e

echo "=== 🔒 Starting O2OEG VPS Hardening & Security Audit ==="

# 1. Update OS Packages
echo "🔄 Updating system package indexes..."
apt-get update && apt-get upgrade -y

# 2. Configure Firewall (UFW)
echo "🛡️ Configuring UFW (Uncomplicated Firewall)..."
apt-get install -y ufw

# Set Defaults
ufw default deny incoming
ufw default allow outgoing

# Allow Core Services
ufw allow 80/tcp comment 'HTTP Web traffic'
ufw allow 443/tcp comment 'HTTPS Web traffic'

# Change SSH Port to a secure custom port (e.g. 2222) if desired, else default 22
ufw allow 22/tcp comment 'Default SSH port'

# Block Database and Bridge ports from outer world (Accessible locally ONLY)
ufw deny 3306/tcp comment 'Block External MySQL'
ufw deny 6379/tcp comment 'Block External Redis'
ufw deny 9005/tcp comment 'Block External WhatsApp Bridge'

# Enable Firewall
echo "y" | ufw enable
ufw status verbose

# 3. Secure SSH Configuration
echo "🔑 Hardening SSH daemon configuration..."
SSH_CONF="/etc/ssh/sshd_config"
if [ -f "$SSH_CONF" ]; then
    # Backup
    cp "$SSH_CONF" "$SSH_CONF.bak"
    
    # Update SSH configurations for highest security
    sed -i 's/#PermitRootLogin yes/PermitRootLogin prohibit-password/g' "$SSH_CONF" || true
    sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/g' "$SSH_CONF" || true
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/g' "$SSH_CONF" || true
    sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/g' "$SSH_CONF" || true
    sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/g' "$SSH_CONF" || true
    
    # Restart service
    systemctl restart sshd || systemctl restart ssh
    echo "✅ SSH Hardening completed successfully. (Only SSH Key login is allowed)."
fi

# 4. Install & Configure Fail2Ban
echo "🚫 Installing Fail2Ban brute-force protection..."
apt-get install -y fail2ban

cat <<EOF > /etc/fail2ban/jail.local
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
EOF

systemctl restart fail2ban
systemctl enable fail2ban
echo "✅ Fail2Ban active and protecting SSH and Web requests."

# 5. Production Performance & Kernel Tuning (Stage 8)
echo "⚡ Applying System Performance Tuning (Sysctl)..."
cat <<EOF >> /etc/sysctl.conf
# Max open files limit
fs.file-max = 2097152

# Network buffer sizes
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# Increase TCP connection backlog limit
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_tw_reuse = 1
EOF
sysctl -p

# 6. Optimize PHP-FPM Configuration
echo "⚡ Optimizing PHP-FPM for VPS memory and high traffic..."
PHP_FPM_CONF=$(find /etc/php -name "www.conf" | head -n 1)
if [ -n "$PHP_FPM_CONF" ]; then
    cp "$PHP_FPM_CONF" "$PHP_FPM_CONF.bak"
    # Set dynamic worker pooling suited for VPS (e.g. 4GB RAM)
    sed -i 's/pm = dynamic/pm = ondemand/g' "$PHP_FPM_CONF" || true
    sed -i 's/pm.max_children = 5/pm.max_children = 50/g' "$PHP_FPM_CONF" || true
    sed -i 's/pm.process_idle_timeout = 10s/pm.process_idle_timeout = 10s/g' "$PHP_FPM_CONF" || true
    sed -i 's/;pm.max_requests = 500/pm.max_requests = 1000/g' "$PHP_FPM_CONF" || true
    
    # Restart PHP
    systemctl restart php*fpm || true
    echo "✅ PHP-FPM optimized for memory conservation and high throughput."
fi

# 7. Configure Automated System Updates
echo "🔄 Setting up Unattended Upgrades for automatic security updates..."
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

echo "=== 🎉 O2OEG VPS Security Hardened & Performance Optimized! ==="
EOF
