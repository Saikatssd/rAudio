#!/bin/bash

cputemp=$( /opt/vc/bin/vcgencmd measure_temp | sed 's/[^0-9.]//g' )
data='
  "page"            : "system"
, "cpuload"         : "'$( cat /proc/loadavg | cut -d' ' -f1-3 )'"
, "cputemp"         : '$( [[ -n $cputemp ]] && echo $cputemp || echo 0 )'
, "startup"         : "'$( systemd-analyze | head -1 | cut -d' ' -f4- | cut -d= -f1 | sed 's/\....s/s/g' )'"
, "throttled"       : "'$( /opt/vc/bin/vcgencmd get_throttled | cut -d= -f2 )'"
, "time"            : "'$( date +'%T %F' )'"
, "timezone"        : "'$( timedatectl | awk '/zone:/ {print $3}' )'"
, "uptime"          : "'$( uptime -p | tr -d 's,' | sed 's/up //; s/ day/d/; s/ hour/h/; s/ minute/m/' )'"
, "uptimesince"     : "'$( uptime -s | cut -d: -f1-2 )'"'

# for interval refresh
(( $# > 0 )) && echo {$data} && exit

dirsystem=/srv/http/data/system

bluetooth=$( systemctl -q is-active bluetooth && echo true || echo false )
if [[ $bluetooth == true ]]; then
	# 'bluetoothctl show' needs active bluetooth
	btdiscoverable=$( bluetoothctl show | grep -q 'Discoverable: yes' && echo true || echo false )
else
	btdiscoverable=false
fi
lcdmodel=$( cat /srv/http/data/system/lcdmodel 2> /dev/null || echo tft35a )
lcd=$( grep -q dtoverlay=$lcdmodel /boot/config.txt 2> /dev/null && echo true || echo false )
readarray -t cpu <<< $( lscpu | awk '/Core|Model name|CPU max/ {print $NF}' )
soccore=${cpu[0]}
(( $soccore > 1 )) && soccpu="$soccore x ${cpu[1]}" || soccpu=${cpu[1]}
socspeed=${cpu[2]/.*}
rpimodel=$( cat /proc/device-tree/model | tr -d '\0' )
if [[ $rpimodel == *BeagleBone* ]]; then
	soc=AM3358
else
	revision=$( awk '/Revision/ {print $NF}' /proc/cpuinfo )
	case ${revision: -4:1} in
		0 ) soc=BCM2835;;
		1 ) soc=BCM2836;;
		2 ) [[ ${revision: -3:2} > 08 ]] && soc=BCM2837B0 || soc=BCM2837;;
		3 ) soc=BCM2711;;
	esac
fi
if ifconfig | grep -q eth0; then
	if [[ -e $dirsystem/soundprofileval ]]; then
		soundprofileval=$( cat $dirsystem/soundprofileval | cut -d= -f2 )
	else
		soundprofileval=$( sysctl kernel.sched_latency_ns | awk '{print $NF}' | tr -d '\0' )
		soundprofileval+=' '$( sysctl vm.swappiness | awk '{print $NF}'  )
		soundprofileval+=' '$( ifconfig eth0 | awk '/mtu/ {print $NF}' )
		soundprofileval+=' '$( ifconfig eth0 | awk '/txqueuelen/ {print $4}' )
	fi
fi
version=$( cat $dirsystem/version )

# sd, usb and nas
if mount | grep -q 'mmcblk0p2 on /'; then
	used_size=( $( df -lh --output=used,size,target | grep '\/$' ) )
	list+=',{"icon":"microsd","mountpoint":"/","mounted":true,"source":"/dev/mmcblk0p2","size":"'${used_size[0]}'B/'${used_size[1]}'B"}'
fi
usb=$( fdisk -lo device | grep ^/dev/sd )
if [[ -n $usb ]]; then
	readarray -t usb <<< "$usb"
	for source in "${usb[@]}"; do
		mountpoint=$( df -l --output=target,source \
						| grep "$source" \
						| sed "s| *$source||" )
		if [[ -n $mountpoint ]]; then
			used_size=( $( df -lh --output=used,size,source | grep "$source" ) )
			list+=',{"icon":"usbdrive","mountpoint":"'$mountpoint'","mounted":true,"source":"'$source'","size":"'${used_size[0]}'B/'${used_size[1]}'B"}'
		else
			label=$( e2label $source )
			[[ -z $label ]] && label=?
			list+=',{"icon":"usbdrive","mountpoint":"/mnt/MPD/USB/'$label'","mounted":false,"source":"'$source'"}'
		fi
	done
fi
nas=$( awk '/\/mnt\/MPD\/NAS/ {print $1" "$2}' /etc/fstab )
if [[ -n $nas ]]; then
	readarray -t nas <<< "$nas"
	for line in "${nas[@]}"; do
		source=$( echo $line | cut -d' ' -f1 | sed 's/\\040/ /g' )
		mountpoint=$( echo $line | cut -d' ' -f2 | sed 's/\\040/ /g' )
		used_size=( $( timeout 0.1s df -h --output=used,size,source | grep "$source" ) )
		if [[ -n $used_size ]]; then
			list+=',{"icon":"networks","mountpoint":"'$mountpoint'","mounted":true,"source":"'$source'","size":"'${used_size[0]}'B/'${used_size[1]}'B"}'
		else
			list+=',{"icon":"networks","mountpoint":"'$mountpoint'","mounted":false,"source":"'$source'"}'
		fi
	done
fi

if grep -q dtparam=i2c_arm=on /boot/config.txt; then
	dev=$( ls /dev/i2c* 2> /dev/null | cut -d- -f2 )
	lines=$( i2cdetect -y $dev 2> /dev/null )
	if [[ -n $lines ]]; then
		i2caddr=$( echo "$lines" \
						| grep -v '^\s' \
						| cut -d' ' -f2- \
						| tr -d ' \-' \
						| grep -v UU \
						| grep . \
						| sort -u )
	fi
fi
if [[ -e $dirsystem/lcdcharval ]]; then
	vals=$( cat $dirsystem/lcdcharval )
	keys=( cols charmap inf address chip pin_rs pin_rw pin_e pins_data backlight )
	if (( $( echo "$vals" | wc -l ) == 6 )); then
		declare -A default=( [inf]=i2c [pin_rs]=15 [pin_rw]=18 [pin_e]=16 [pins_data]=21,22,23,24 )
	else
		declare -A default=( [inf]=gpio [address]=0x27 [chip]=PCF8574 )
	fi
	kL=${#keys[@]}
	for (( i=0; i < $kL; i++ )); do
		k=${keys[$i]}
		line=$( grep $k <<< "$vals" )
		if (( i > 0 && i < 5 )); then
			[[ -n $line ]] && pins+=",\"${line/*=}\"" || pins+=",\"${default[$k]}\""
		else
			[[ -n $line ]] && pins+=",${line/*=}" || pins+=",${default[$k]}"
		fi
	done
	lcdcharval=[${pins:1}]
else
	lcdcharval='[20,"A00","i2c","0x27","PCF8574",15,18,16,21,22,23,24,false]'
fi

data+='
, "audioaplayname"  : "'$( cat $dirsystem/audio-aplayname 2> /dev/null )'"
, "audiooutput"     : "'$( cat $dirsystem/audio-output 2> /dev/null )'"
, "bluetooth"       : '$bluetooth'
, "btdiscoverable"  : '$btdiscoverable'
, "btformat"        : '$( [[ -e $dirsystem/btformat ]] && echo true || echo false )'
, "hostapd"         : '$( systemctl -q is-active hostapd && echo true || echo false )'
, "hostname"        : "'$( hostname )'"
, "kernel"          : "'$( uname -rm )'"
, "lcd"             : '$lcd'
, "lcdchar"         : '$( [[ -e $dirsystem/lcdchar ]] && echo true || echo false )'
, "lcdcharaddr"     : "'$( [[ -n $i2caddr ]] && echo 0x$i2caddr || echo 0x27 0x3F )'"
, "lcdcharval"      : '$lcdcharval'
, "list"            : ['${list:1}']
, "lcdmodel"        : "'$lcdmodel'"
, "mpdoled"         : '$( [[ -e $dirsystem/mpdoled ]] && echo true || echo false )'
, "mpdoledval"      : '$( grep mpd_oled /etc/systemd/system/mpd_oled.service | cut -d' ' -f3 )'
, "ntp"             : "'$( grep '^NTP' /etc/systemd/timesyncd.conf | cut -d= -f2 )'"
, "powerbutton"     : '$( systemctl -q is-enabled powerbutton && echo true || echo false )'
, "powerbuttonpins" : "'$( cat $dirsystem/powerbuttonpins 2> /dev/null | cut -d= -f2 )'"
, "reboot"          : "'$( cat /srv/http/data/shm/reboot 2> /dev/null | sed 's/"/\\"/g' )'"
, "regdom"          : "'$( cat /etc/conf.d/wireless-regdom | cut -d'"' -f2 )'"
, "relays"          : '$( [[ -e $dirsystem/relays ]] && echo true || echo false )'
, "rpimodel"        : "'$rpimodel'"
, "soc"             : "'$soc'"
, "soccpu"          : "'$soccpu'"
, "socram"          : "'$( free -h | grep Mem | awk '{print $2}' )'B"
, "socspeed"        : "'$socspeed'"
, "soundprofile"    : '$( [[ -e $dirsystem/soundprofile ]] && echo true || echo false )'
, "soundprofileval" : "'$soundprofileval'"
, "version"         : "'$version'"
, "versionui"       : '$( cat /srv/http/data/addons/r$version 2> /dev/null || echo 0 )'
, "vuled"           : '$( [[ -e /srv/http/data/system/vuled ]] && echo true || echo false )'
, "vuledval"        : "'$( cat /srv/http/data/system/vuledpins 2> /dev/null )'"
, "wlan"            : '$( rfkill | grep -q wlan && echo true || echo false )'
, "wlannoap"        : '$( [[ -e $dirsystem/wlannoap ]] && echo true || echo false )'
, "wlanconnected"   : '$( ip r | grep -q "^default.*wlan0" && echo true || echo false )

echo {$data}
