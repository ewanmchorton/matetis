#!/bin/bash
# Картинки спутника для приложения: из design/character в public/character. Нужен macOS (sips).
#   stage N.PNG  → stage-N.png – в полный рост, 800 px;
#   avatar N.PNG → avatar-N.png – кружок, 256 px. Пока кружков от дизайнера нет,
#   кружок вырезается из stage N: голова и плечи, как в макете профиля.
# Запуск: bash scripts/build-character.sh
set -euo pipefail

src="design/character"
out="public/character"
mkdir -p "$out"

# Кадр кружка в stage N (1254 × 1254): центр лица по высоте и сторона квадрата.
face_y=(0 596 596 580 549 517 533)
side=(0 720 740 780 800 820 800)

# «stage 1.PNG», «stage-1.png» и «stage_1.png» – одно и то же.
find_file() {
  find "$src" -maxdepth 1 -iname "$1[ _-]$2.png" | head -1
}

for n in 1 2 3 4 5 6; do
  stage=$(find_file stage "$n")
  [ -n "$stage" ] || { echo "Нет $src/stage $n.PNG" >&2; exit 1; }
  sips -Z 800 "$stage" --out "$out/stage-$n.png" >/dev/null

  avatar=$(find_file avatar "$n")
  if [ -n "$avatar" ]; then
    sips -Z 256 "$avatar" --out "$out/avatar-$n.png" >/dev/null
  else
    width=$(sips -g pixelWidth "$stage" | awk '/pixelWidth/ {print $2}')
    s=$(( side[n] * width / 1254 ))
    y=$(( face_y[n] * width / 1254 - s * 52 / 100 ))
    x=$(( (width - s) / 2 ))
    sips -c "$s" "$s" --cropOffset "$y" "$x" "$stage" --out "$out/avatar-$n.png" >/dev/null
    sips -Z 256 "$out/avatar-$n.png" >/dev/null
  fi
done

echo "Готово: $out"
