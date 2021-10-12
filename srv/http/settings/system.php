<?php
$i2slist = json_decode( file_get_contents( '/srv/http/settings/system-i2s.json' ) );
$selecti2s = '<select id="i2smodule">';
foreach( $i2slist as $name => $sysname ) {
	$selecti2s.= '<option value="'.$sysname.'">'.$name.'</option>';
}
$selecti2s.= '</select>';
$timezonelist = timezone_identifiers_list();
$selecttimezone = '<select id="timezone">';
foreach( $timezonelist as $key => $zone ) {
	$datetime = new DateTime( 'now', new DateTimeZone( $zone ) );
	$offset = $datetime->format( 'P' );
	$zonename = preg_replace( [ '/_/', '/\//' ], [ ' ', ' <gr>&middot;</gr> ' ], $zone );
	$selecttimezone.= '<option value="'.$zone.'">'.$zonename.'&ensp;'.$offset.'</option>\n';
}
$selecttimezone.= '</select>';

echo '
<div id="gpiosvg" class="hide">';
include 'assets/img/gpio.svg';
echo '
</div>';

htmlHead( [ //////////////////////////////////
	  'title'  => 'System'
	, 'status' => 'journalctl'
	, 'nohelp' => true
] );
?>
<div id="systemlabel" class="col-l text gr">
		Version
	<br>Kernel
	<br>Hardware
	<br>SoC
	<br>CPU
</div>
<div id="systemvalue" class="col-r text"></div> 
<div style="clear:both"></div>
<?php
htmlHead( [ //////////////////////////////////
	  'title'  => 'Status'
	, 'button' => [ 'refresh', 'refresh' ]
] );
?>
<div id="statuslabel" class="col-l text gr">
		CPU Load
	<span id="cputemp"><br>CPU Temperature</span>
	<br>Time
	<br>Up Time
	<br>Boot Duration
</div>
<div id="status" class="col-r text"></div>

<div class="col-l" style="height:0"></div>
<div class="col-r">
	<div class="help-block hide">
&ensp;<i class="fa fa-refresh"></i> <gr>Toggle refresh every 10 seconds.</gr>

CPU Load:
 &bull; Average number of processes which are being executed and in waiting.
 &bull; calculated over 1, 5 and 15 minutes.
 &bull; Each one should not be constantly over 0.75 x CPU cores.
CPU temperature:
 &bull; 80-84°C: ARM cores throttled.
 &bull; 85°C: ARM cores and GPU throttled.
 &bull; RPi 3B+: 60°C soft limit (optimized throttling)

<i class="fa fa-warning"></i> Under-voltage warning: <code>vcgencmd get_throttled</code>
 &bull; "occurred" - Events happenned.
 &bull; "currently detected" - Currently under minimum limit. System unstable is very likely.
 &bull; More info - <a href="https://www.raspberrypi.org/documentation/raspbian/applications/vcgencmd.md">vcgencmd</a>
</div>
</div>
<div style="clear:both"></div>
<pre id="codeundervoltage" class="hide"></pre>
<?php
htmlHead( [ //////////////////////////////////
	  'title'  => 'Storage'
	, 'status' => 'mount'
	, 'button' => [ 'addnas', 'plus-circle wh' ]
] );
?>
<ul id="list" class="entries"></ul>
<div class="help-block hide">
Available sources, local USB and NAS mounts, for Library.
 &bull; USB drive will be found and mounted automatically.
 &bull; Network shares must be manually configured.
 &bull; If mount failed, try in SSH terminal:
<pre>
mkdir -p "/mnt/MPD/NAS/<bll>NAME</bll>"

# CIFS:
mount -t cifs "//<bll>IP</bll>/<bll>SHARENAME</bll>" "/mnt/MPD/NAS/<bll>NAME</bll>" \
      -o noauto,username=<bll>USER</bll>,password=<bll>PASSWORD</bll>,uid=UID,gid=GID,iocharset=utf8
# NFS:
mount -t nfs "<bll>IP</bll>:<bll>/SHARE/PATH</bll>" "/mnt/MPD/NAS/<bll>NAME</bll>" \
      -o defaults,noauto,bg,soft,timeo=5
</pre>
</div>

<?php
$rev = substr( exec( "awk '/Revision/ {print \$NF}' /proc/cpuinfo" ), -3, 2 );
if ( in_array( $rev, [ '08', '0c', '0d', '0e', '11' ] ) ) {
// ----------------------------------------------------------------------------------
htmlHead( [ //////////////////////////////////
	  'title'  => 'Wireless'
	, 'status' => 'rfkill'
] );
htmlSetting( [
	  'label'    => 'Bluetooth'
	, 'id'       => 'bluetooth'
	, 'sublabel' => 'bluetoothctl'
	, 'icon'     => 'bluetooth'
	, 'status'   => 'bluetoothctl'
	, 'setting'  => 'preenable'
	, 'help'     => <<<html
Pairing: &emsp; <i class="fa fa-networks"></i> Networks
html
] );
htmlSetting( [
	  'label'    => 'Wi-Fi'
	, 'id'       => 'wlan'
	, 'sublabel' => 'iw'
	, 'icon'     => 'wifi'
	, 'status'   => 'iw'
	, 'setting'  => 'preenable'
	, 'help'     => <<<html
Auto start Access Point - On failed connection or no router
Country of Wi-Fi regulatory domain:
 &bull; 00 = Least common denominator settings, channels and transmit power are permitted in all countries.
 &bull; The connected router may override it to a certain country.
html
] );
// ----------------------------------------------------------------------------------
}
htmlHead( [ //////////////////////////////////
	  'title'  => 'GPIO Devices'
	, 'status' => 'configtxt'
] );
htmlSetting( [
	  'label'    => 'Audio - I²S'
	, 'id'       => 'i2smodulesw'
	, 'icon'     => 'i2saudio'
	, 'input'    => <<<html
<div id="divi2smodulesw">
	<input id="i2smodulesw" type="checkbox">
	<div class="switchlabel" for="i2smodulesw"></div>
</div>
<div id="divi2smodule">$selecti2s</div>
html
	, 'help'     => <<<html
<a class="img" data-name="lcdchar">LCD module</a> - display playback data
 &bull; Support 16x2 and 20x4 LCD modules.
<i class="fa fa-warning"></i> LCD with I²C backpack must be modified: <a class="img" data-name="i2cbackpack">5V to 3.3V I²C and 5V LCD</a>
html
] );
htmlSetting( [
	  'label'    => 'Character LCD'
	, 'id'       => 'lcdchar'
	, 'sublabel' => 'HD44780'
	, 'icon'     => 'lcdchar'
	, 'setting'  => 'preenable'
	, 'help'     => <<<html
<a class="img" data-name="lcdchar">LCD module</a> - display playback data
 &bull; Support 16x2 and 20x4 LCD modules.
<i class="fa fa-warning"></i> LCD with I²C backpack must be modified: <a class="img" data-name="i2cbackpack">5V to 3.3V I²C and 5V LCD</a>
html
] );
htmlSetting( [
	  'label'    => 'Power Button'
	, 'id'       => 'powerbutton'
	, 'sublabel' => 'Power LED'
	, 'icon'     => 'power'
	, 'setting'  => 'preenable'
	, 'help'     => <<<html
<a class="img" data-name="powerbutton">Power button and LED</a> - power on/off rAudio
 &bull; On - Fixed to pin 5
 &bull; Off - Default to pin 5 (single pin on+off)
If pin 5 is used by DAC or LCD - Set 2 unused pins for:
 &bull; Off (default: 7)
 &bull; Reserved (default: 29)
html
] );
htmlSetting( [
	  'label'   => 'Relay Module'
	, 'id'      => 'relays'
	, 'icon'    => 'relays'
	, 'setting' => 'self'
	, 'help'    => <<<html
<a class="img" data-name="relays">Relay module</a> - power on/off peripheral equipments
Settings: &ensp;<i class="fa fa-sliders"></i>Features |&ensp;<i class="fa fa-relays"></i>
 &bull; More info: <a href="https://github.com/rern/R_GPIO/blob/master/README.md">+R GPIO</a>
 &bull; Can be enabled and run as a test without a connected relay module.
html
] );
htmlSetting( [
	  'label'   => 'Spectrum OLED'
	, 'id'      => 'mpdoled'
	, 'icon'    => 'mpdoled'
	, 'setting' => 'preenable'
	, 'help'    => <<<html
<a class="img" data-name="mpdoled">OLED module</a> - display audio level spectrum
html
] );
htmlSetting( [
	  'label'   => 'TFT 3.5" LCD'
	, 'id'      => 'lcd'
	, 'icon'    => 'lcd'
	, 'setting' => 'preenable'
	, 'help'    => <<<html
<a class="img" data-name="lcd">TFT LCD module</a> with resistive touchscreen - local display
html
	, 'exist'   => file_exists( '/usr/bin/chromium' )
] );
htmlSetting( [
	  'label'   => 'VU LED'
	, 'id'      => 'vuled'
	, 'icon'    => 'led'
	, 'setting' => 'preenable'
	, 'help'    => <<<html
<a class="img" data-name="vuled">7 LEDs</a> - display audio level
 &bull; <bl id="ledcalc">LED resister calculator</bl>
html
] );
htmlHead( [ 'title' => 'Environment' ] ); //////////////////////////////////
htmlSetting( [
	  'label' => 'Host Name'
	, 'id'    => 'hostname'
	, 'icon'  => 'plus-r'
	, 'input' => '<input type="text" id="hostname" readonly>'
	, 'help'  => <<<html
For:
 &bull; Access point, AirPlay, Bluetooth, SnapCast, Spotify, UPnP
 &bull; Web Interface URL: <code id="avahiurl"></code>
 &bull; System hostname
html
] );
htmlSetting( [
	  'label'    => 'Time Zone'
	, 'id'       => 'timezone'
	, 'sublabel' => 'timesyncd'
	, 'icon'     => 'globe'
	, 'status'   => 'timesyncd'
	, 'input'    => $selecttimezone
	, 'setting'  => 'self'
	, 'help'     => <<<html
<i class="fa fa-gear"></i>Servers:
 &bull; NTP: For time sync
 &bull; Package mirror: For system upgrade <code>pacman -Syu</code>
html
] );
htmlSetting( [
	  'label'    => 'Sound Profile'
	, 'id'       => 'soundprofile'
	, 'sublabel' => 'sysctl'
	, 'icon'     => 'soundprofile'
	, 'status'   => 'soundprofile'
	, 'setting'  => 'preenable'
	, 'help'     => <<<html
Tweak kernel parameters for <a href="https://www.runeaudio.com/forum/sound-signatures-t2849.html">sound profiles</a>.
html
] );
htmlHead( [ 'title' => 'Settings and Data' ] ); //////////////////////////////////
htmlSetting( [
	  'label' => 'Backup'
	, 'id'    => 'backup'
	, 'icon'  => 'sd'
	, 'help'  => <<<html
Backup all settings and Library database:
 &bull; Settings
 &bull; Library database
 &bull; Saved playlists
 &bull; Bookmarks
 &bull; Lyrics
 &bull; WebRadios
html
] );
htmlSetting( [
	  'label' => 'Restore'
	, 'id'    => 'restore'
	, 'icon'  => 'restore'
	, 'help'  => <<<html
Restore all settings and Library database from a backup file. The system will reboot after finished.
html
] );
echo '
</div>'; // last closing for no following htmlHead()
$listui = [
	  'jQuery'             => 'https://jquery.com/'
	, 'HTML5-Color-Picker' => 'https://github.com/NC22/HTML5-Color-Picker'
	, 'Inconsolata font'   => 'https://github.com/google/fonts/tree/main/ofl/inconsolata'
	, 'jQuery Selectric'   => 'https://github.com/lcdsantos/jQuery-Selectric'
	, 'Lato-Fonts'         => 'http://www.latofonts.com/lato-free-fonts'
	, 'lazysizes'          => 'https://github.com/aFarkas/lazysizes'
	, 'pica'               => 'https://github.com/nodeca/pica'
	, 'QR Code generator'  => 'https://github.com/datalog/qrcode-svg'
	, 'roundSlider'        => 'https://github.com/soundar24/roundSlider'
	, 'simple-keyboard'    => 'https://github.com/hodgef/simple-keyboard/'
	, 'Sortable'           => 'https://github.com/SortableJS/Sortable'
];
$uihtml = '';
foreach( $listui as $name => $link ) {
	$uihtml.= $localhost ? $name.'<br>' : '<a href="'.$link.'" target="_blank">'.$name.'</a><br>';
}
$version = file_get_contents( '/srv/http/data/system/version' );
?>
<heading>About</heading>
<i class="fa fa-plus-r fa-lg gr"></i>&ensp;<a href="https://github.com/rern/rAudio-<?=$version?>/discussions">r A u d i o&emsp;<?=$version?></a>
<br><gr>by</gr>&emsp;r e r n
<br>&nbsp;

<heading class="sub">Back End</heading>
<a href="https://www.archlinuxarm.org" target="_blank">ArchLinuxArm</a>
<br><a class="listtitle">Packages&ensp;<i class="fa fa-chevron-down"></i></a>
<div class="list hide"></div><br>&nbsp;

<heading class="sub">Front End</heading>
<br><a href="https://whatwg.org" target="_blank">HTML</a>
<br><a href="https://www.w3.org/TR/CSS" target="_blank">CSS</a>
<br><a href="https://www.php.net" target="_blank">PHP</a>
<br><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">JavaScript</a>
<br><a class="listtitle">JS libraries and plugins&ensp;<i class="fa fa-chevron-down"></i></a>
<div class="list hide"><?=$uihtml?></div><br>&nbsp;

<heading class="sub">Data</heading>
<div class="gr">
<a href="https://www.last.fm">last.fm</a> - Coverarts and artist biographies<br>
<a href="https://webservice.fanart.tv">fanart.tv</a> - Artist images and fallback coverarts<br>
<a href="https://radioparadise.com">Radio Paradise</a>, <a href="https://www.fip.fr/">Fip</a>, <a href="https://www.francemusique.fr/">France Musique</a> - Coverarts for each stations<br>
<a href="http://gnudb.gnudb.org">GnuDB</a> - Audio CD data
</div>
