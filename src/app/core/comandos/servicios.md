# Servicios

Comando: systemctl list-units --type=service

Iniciar un servicio: systemctl start nombre-del-servicio.
Detener un servicio: systemctl stop nombre-del-servicio.
Reiniciar un servicio: systemctl restart nombre-del-servicio.
Habilitar un servicio para que se inicie al arrancar el sistema: systemctl enable nombre-del-servicio.
Deshabilitar un servicio para que no se inicie al arrancar: systemctl disable nombre-del-servicio. 


CPU
grep 'cpu ' /proc/stat | awk '{usage=100-($5*100)/($2+$3+$4+$5+$6+$7+$8)} END {print usage}'
cat /proc/cpuinfo
lscpu
sar
sar -u | sed '1,5d'       -- estadistica del uso del CPU quita las primero 5 lineas
sar -u | grep '^[0-9]' | awk '{sum+=$3; count++} END {if(count>0) print sum/count"%"}'            ---- porcentaje del CPU que es usado

Load
cat /proc/loadavg


Servicios
```bash
systemctl list-units --type=service
systemctl --failed --type=service
systemctl list-units --type=service --state=running --plain --no-legend
```


Usuarios
```bash
lslogins -u
lslogins -u | awk '{print $1","$2","$3","$4,","$5,","$6","$7}'
lslogins -u | awk '{print $1","$2","$3","$4,","$5,","$6","$7}' | sed '1,1d'
awk -F: '$3 > 1000 {print $1}' /etc/passwd
lslogins santiago.borja
lslogins --user-accs --supp-groups --acc-expiration | awk '{print $1","$2","$3","$4,","$5,","$6","$7,"$8,"$9}' | sed '1,1d'

lslogins --user-accs --output=UID,USER,GID,GROUP,PWD-WARN,PWD-MIN,PWD-MAX,PWD-CHANGE,PWD-EXPIR,LAST-HOSTNAME,LAST-LOGIN | awk '{print $1"|"$2"|"$3"|"$4"|"$5"|"$6"|"$7"|"$8"|"$9"|"$10}' | sed '1,1d'`

lslogins --user-accs --output=UID,USER,GID,GROUP,LAST-HOSTNAME,LAST-LOGIN,PWD-CHANGE,PWD-EXPIR,PWD-WARN,PWD-MAX,PWD-MIN | awk '{print $1"|"$2"|"$3"|"$4"|"$5"|"$6"|"$7"|"$8"|"$9"|"$10"|"$11}' | sed '1,1d'

 lslogins --user-accs --output=UID,USER,GID,GROUP,LAST-HOSTNAME,LAST-LOGIN,PWD-CHANGE,PWD-EXPIR,PWD-WARN,PWD-MAX,PWD-MIN,SUPP-GIDS,SUPP-GROUPS --colon-separate



 lslogins --user-accs --output=USER,UID,GECOS,HOMEDIR,SHELL,NOLOGIN,PWD-LOCK,PWD-EMPTY,PWD-DENY,PWD-METHOD,GROUP,GID,SUPP-GROUPS,SUPP-GIDS,LAST-LOGIN,LAST-TTY,LAST-HOSTNAME,FAILED-LOGIN,FAILED-TTY,HUSHED,PWD-WARN,PWD-CHANGE,PWD-MIN,PWD-MAX,PWD-EXPIR,CONTEXT,PROC --colon-separate

 0 - USER
 1 - UID
 2 - GECOS
 3 - HOMEDIR
 4 - SHELL
 5 - NOLOGIN
 6 - PWD-LOCK
 7 - PWD-EMPTY
 8 - PWD-DENY
 9 - PWD-METHOD
10 - GROUP
11 - GID
12 - SUPP-GROUPS
13 - SUPP-GIDS
14 - LAST-LOGIN
15 - LAST-TTY
16 - LAST-HOSTNAME
17 - FAILED-LOGIN
18 - FAILED-TTY
19 - HUSHED
20 - PWD-WARN
21 - PWD-CHANGE
22 - PWD-MIN
23 - PWD-MAX
24 - PWD-EXPIR
25 - CONTEXT
26 - PROC


UID,USER,PROC,PWD-LOCK,PWD-DENY,LAST-LOGIN,GECOS
0,root,11,0 ,0 ,Jul19/02:01,root
1000,ec2-user,0,0 ,0 ,Jul19/02:20,
1001,santiago.borja,0,0 ,0 ,,



```

```bash
df -hT | grep -E 'ext4|xfs|btrfs' | awk '{print $3, $4, $5, $6}'
cat /proc/loadavg | awk '{print $1, $2, $3}'
sar -u | grep '^[0-9]' | awk '{sum+=$3; count++} END {if(count>0) print sum/count}'
free -h | grep -E 'Mem' | awk '{print $2, $3, $4}'
sec=$(( $(date +%s) - $(date -d "$(ps -p 1 -o lstart=)" +%s) )); d=$((sec/86400)); h=$(( (sec%86400)/3600 )); m=$(( (sec%3600)/60 ))((sec%60)) printf "%02d:%02d:%02d:%02d\n" $d $h $m $s'
cat /etc/os-release"
systemctl list-units --type=service
systemctl list-units --type=service | tr -s ' ' | tr ' ' '|'
systemctl list-units --type=service --all  --no-legend
systemctl list-units --type=service --all --no-legend | awk '{print $1","$2","$3","$4,","$5,","$6","$7","$8","$9}'
cat /proc/cpuinfo"
```