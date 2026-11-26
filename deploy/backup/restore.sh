#!/bin/sh
# Восстановление базы из копии в S3.
#   Список копий:  docker compose exec backup restore.sh
#   Проверка:      docker compose exec backup restore.sh matetis-….dump restore_check
#                  (во временную базу restore_check, рабочая база не меняется)
#   Восстановить рабочую базу – см. README.md, раздел «Сервер».
set -eu

if [ $# -eq 0 ]; then
  rclone lsl "s3:$S3_BUCKET/db/" --s3-no-check-bucket | sort -k2,3
  exit 0
fi

name=$1
target=${2:?"Укажите базу, в которую восстановить, например restore_check"}
if [ "$target" = "${DATABASE_URL##*/}" ] && [ "${3:-}" != "--replace" ]; then
  echo "Это рабочая база. Чтобы заменить её копией, остановите приложение и добавьте --replace" >&2
  exit 1
fi
file="/tmp/$name"
trap 'rm -f "$file"' EXIT

rclone copyto "s3:$S3_BUCKET/db/$name" "$file" --s3-no-check-bucket
admin_url="${DATABASE_URL%/*}/postgres"
psql "$admin_url" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$target\" WITH (FORCE)" -c "CREATE DATABASE \"$target\""
pg_restore --no-owner --exit-on-error --dbname="${DATABASE_URL%/*}/$target" "$file"
echo "База $target восстановлена из $name"
