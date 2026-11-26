#!/bin/sh
# Одна копия базы: сжатая выгрузка в S3, затем удаление копий старше BACKUP_KEEP_DAYS.
# Вручную: docker compose exec backup backup.sh
set -eu

name="matetis-$(date +%F-%H%M).dump"
file="/tmp/$name"
trap 'rm -f "$file"' EXIT

pg_dump --format=custom --no-owner --file="$file" "$DATABASE_URL"
rclone copyto "$file" "s3:$S3_BUCKET/db/$name" --s3-no-check-bucket
rclone delete "s3:$S3_BUCKET/db/" --min-age "${BACKUP_KEEP_DAYS}d" --s3-no-check-bucket
echo "$(date '+%F %T') копия базы сохранена: $name ($(du -h "$file" | cut -f1))"
