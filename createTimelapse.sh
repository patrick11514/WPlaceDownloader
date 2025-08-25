#!/bin/bash

# This script gathers the full history of the example.png from repository, and create git animation as timelapse.gif

mkdir -p frames

rm frames/*.png

i=0
for h in $(git log --follow --format=%H -- example.png | tac); do
    git show "$h:./example.png" > "frames/$(printf "%04d" $i).png"
    i=$((i + 1))
done

rm frames/0001.png # remove the first frame, it's blank, because of CI issues back then 

ffmpeg -framerate 6 -pattern_type glob -i 'frames/*.png' \
  -vf "palettegen=reserve_transparent=1" -y palette.png

ffmpeg -framerate 6 -pattern_type glob -i 'frames/*.png' -i palette.png \
  -lavfi "paletteuse=dither=bayer:diff_mode=rectangle" \
  -gifflags -transdiff -y timelapse.gif