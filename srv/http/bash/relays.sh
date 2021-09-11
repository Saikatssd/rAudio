#!/bin/bash

dirbash=/srv/http/bash
dirsystem=/srv/http/data/system
dirtmp=/srv/http/data/shm

# convert each line to each args
readarray -t args <<< "$1"

cmd=${args[0]}

if [[ $cmd == relaysset ]]; then
	data=${args[1]}
	echo -e "$data" > $dirsystem/relayspins
	data=$( $dirbash/relays-data.sh )
	curl -s -X POST http://127.0.0.1/pub?id=refresh -d "$data"
	exit
fi

. $dirsystem/relayspins

pushstream() {
	curl -s -X POST http://127.0.0.1/pub?id=relays -d "$1"
}

mpc stop
systemctl stop radio
rm -f $dirtmp/status

if [[ $cmd == true ]]; then
	pushstream '{"state": true, "order": '"$onorder"'}'
	for i in 0 1 2 3; do
		pin=${on[$i]}
		(( $pin == 0 )) && break
		
		gpio -1 mode $pin out
		gpio -1 write $pin 1
		(( $i > 0 )) && pushstream '{"on": '$(( i + 1 ))'}'
		sleep ${ond[$i]} &> /dev/null
	done
	touch $dirtmp/relayson
	$dirbash/relaystimer.sh &> /dev/null &
else
	pushstream '{"state": false, "order": '"$offorder"'}'
	for i in 0 1 2 3; do
		pin=${off[$i]}
		(( $pin == 0 )) && break
		
		gpio -1 write $pin 0
		(( $i > 0 )) && pushstream '{"off": '$(( i + 1 ))'}'
		sleep ${offd[$i]} &> /dev/null
	done
	rm -f $dirtmp/relayson
	killall relaystimer.sh &> /dev/null
fi

sleep 1
$dirbash/cmd-pushstatus.sh
pushstream '{"done":1}'
