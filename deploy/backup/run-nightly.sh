#!/bin/sh
# Каждую ночь в BACKUP_HOUR (по TZ) делает одну копию базы.
# Проверка раз в 5 минут: если сервер перезапустился в этот час, копия всё равно будет.
set -u

last_day=""
echo "Копии базы: каждую ночь в ${BACKUP_HOUR}:00 (${TZ})"
while true; do
  today=$(date +%F)
  if [ "$(date +%H)" = "$BACKUP_HOUR" ] && [ "$last_day" != "$today" ]; then
    if backup.sh; then last_day=$today; fi
  fi
  sleep 300
done
