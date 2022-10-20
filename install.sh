#!/bin/bash

alias=r1

. /srv/http/bash/addons.sh

# 20221021
if [[ -L $dirmpd  && ! -e /mnt/MPD/.mpdignore ]]; then
	echo "\
SD
USB" > /mnt/MPD/.mpdignore
fi

# 20221007
grep -q hard,intr /etc/fstab && sed -i '/hard,intr/soft/' /etc/fstab

[[ -e $dirsystem/hddspindown ]] && mv $dirsystem/{hddspindown,apm}

if [[ ! -e /boot/kernel.img ]]; then
	dir=/etc/systemd/system
	for file in $dir/spotifyd.service $dir/upmpdcli.service; do
		! grep -q CPUAffinity $file && sed -i -e '/Service/ a\CPUAffinity=3' -e '/ExecStartPost/ d' -e 's|/usr/bin/taskset -c 3 ||' $file
	done
	for file in $dir/mpd.service.d/override.conf $dir/shairport-sync.service.d/override.conf; do
		! grep -q CPUAffinity $file && sed -i -e '/Service/ a\CPUAffinity=3' -e '/ExecStart/ d' $file
	done
	for file in $dir/bluealsa.service.d/override.conf $dir/bluetooth.service.d/override.conf; do
		! grep -q CPUAffinity $file && sed -i -e '/Service/ a\CPUAffinity=3' $file
	done
fi

dir=/srv/http/assets/img/guide
if [[ ! -e $dir/1.jpg ]]; then
	mkdir -p $dir
	if [[ -e /srv/http/assets/img/1.jpg ]]; then
		find /srv/http/assets/img -maxdepth 1 -type f -name '[0-9]*' -exec mv {} $dir \;
	else
		curl -skL https://github.com/rern/_assets/raw/master/guide/guide.tar.xz | bsdtar xf - -C $dir
	fi
fi

file=/etc/systemd/system/dab.service
if [[ -e /usr/bin/rtl_sdr && ! -e $file ]]; then
	echo "\
[Unit]
Description=DAB Radio metadata

[Service]
Type=simple
ExecStart=/srv/http/bash/status-dab.sh
" > $file
	systemctl daemon-reload
fi


# 20220916
if (( $( cat $dirmpd/counts | wc -l ) == 1 )); then
	echo '{
  "playlists" : '$( ls -1 $dirplaylists | wc -l )'
, "webradio"  : '$( find -L $dirwebradio -type f ! -path '*/img/*' | wc -l )'
}' > $dirmpd/counts
fi

# 20220907
[[ $( pacman -Q bluez ) < 'bluez 5.65-3' ]] && pacman -Sy --noconfirm bluez bluez-utils

#-------------------------------------------------------------------------------
installstart "$1"

getinstallzip

chmod +x $dirsettings/system.sh
$dirsettings/system.sh dirpermissions
[[ -e $dirsystem/color ]] && $dirbashbash/cmd.sh color

installfinish
#-------------------------------------------------------------------------------

# 20221021
$mpdconf=$dirmpd/mpd.conf
[[ -e $mpdconf ]] && exit

rm -f $dirsystem/streaming
sed -i 's/On-board -/On-board/' $dirsystem/audio-output &> /dev/null
mv $dirsystem/custom-global $dirmpd/mpd-custom &> /dev/null
file=$dirsystem/soxr.conf
if [[ -e $file ]]; then
	sed -i '1 i\
resampler {\
	plugin         "soxr"
' $file
	mv $file $dirmpd/mpd-soxr-custom
fi

[[ -e $dirshm/audiocd ]] && ln -s $dirmpd/mpd-cdio{,.conf}
[[ -e $dirsystem/custom && -e $dirmpd/mpd-custom ]] && ln -s $dirmpd/mpd-custom{,.conf}
grep -q plugin.*ffmpeg /etc/mpd.conf && ln -s $dirmpd/mpd-ffmpeg{,.conf}
grep -q type.*httpd /etc/mpd.conf && ln -s $dirmpd/mpd-httpd{,.conf}
systemctl -q is-active snapserver && ln -s $dirmpd/mpd-snapserver{,.conf}
grep -q quality.*custom /etc/mpd.conf && ln -sf $dirmpd/mpd-soxr{-custom,.conf}

grep -q volume_normalization /etc/mpd.conf && sed -i '/^user/ i\volume_normalization   "yes"' $mpdconf
if ! grep -q replaygain.*off /etc/mpd.conf; then
	replaygain=$( < $dirsystem/replaygain.conf )
	sed -i '/^user/ i\replaygain          "'$replaygain'"' $mpdconf
fi

file=/etc/systemd/system/mpd.service.d/override.conf
if ! grep -q ExecStart $file; then
	echo "\
ExecStart=
ExecStart=/usr/bin/mpd --systemd /srv/http/data/mpd/mpd.conf" >> $file
	systemctl daemon-reload
fi

$dirsettings/player-conf.sh

# 20221010
[[ -e /srv/http/shareddata ]] && echo -e "$info Shared Data must be disabled and setup again."
