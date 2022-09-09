#!/bin/bash

killsubs() {
	kill $DABPID
	kill $FFMPID
	rm $MYPIPE
	echo NO INFO > /srv/http/data/shm/webradio/DABlabel.txt
}
trap killsubs SIGINT

MYPIPE=$( mktemp -u )
mkfifo $MYPIPE

pidof -q dab-rtlsdr-3 && sleep 4 # if another radio is playing, give time to stop

dab-rtlsdr-3 \
	-S $1 \
	-C $2 \
	-i /srv/http/data/shm/webradio \
	> $MYPIPE &
DABPID=$!

ffmpeg \
	-re \
	-stream_loop -1 \
	-ac 2 \
	-ar 48000 \
	-f s16le \
	-i $MYPIPE \
	-vn \
	-b:a 160k \
	-c:a aac \
	-metadata title="DAB Radio" \
	-f rtsp rtsp://localhost:$3/$4 \
	&> /dev/null &
FFMPID=$!

wait $FFMPID