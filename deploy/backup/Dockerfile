# Копии базы в S3. Версия postgres – та же, что у базы: pg_dump старее базы копию не сделает.
FROM postgres:17-alpine
# Хранилище rclone настраивает из переменных RCLONE_CONFIG_S3_*, пустой файл – чтобы не жаловался.
RUN apk add --no-cache rclone && mkdir -p /root/.config/rclone && touch /root/.config/rclone/rclone.conf
COPY backup.sh restore.sh run-nightly.sh /usr/local/bin/
CMD ["run-nightly.sh"]
