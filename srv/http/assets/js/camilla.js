V            = {
	  currenttab : 'devices'
	, signal     : {}
	, status     : {}
}
var ws       = new WebSocket( 'ws://'+ window.location.host +':1234' );
var wssignal = [ 'GetSignalRange', 'GetCaptureSignalPeak', 'GetCaptureSignalRms', 'GetPlaybackSignalPeak', 'GetPlaybackSignalRms' ];
var wsstatus = [ 'GetState', 'GetCaptureRate', 'GetRateAdjust', 'GetClippedSamples', 'GetBufferLevel' ];
ws.onmessage = response => {
	var data  = JSON.parse( response.data );
	var cmd   = Object.keys( data )[ 0 ];
	var value = data[ cmd ].value;
	if ( wssignal.includes( cmd ) ) {
		var el = cmd.replace( 'Get', '#' )
		$( el ).css( 'width', value );
	} else if ( wsstatus.includes( cmd ) ) {
		V.status[ cmd ] = value;
		if ( cmd === 'GetBufferLevel' ) {
			S.status = '';
			wsstatus.forEach( k => S.status += V.status[ k ] +'<br>' );
			$( '#statusvalue' ).html( S.status );
		}
	} else if ( cmd === 'GetVolume' ) {
		S.volume = value;
	} else if ( cmd === 'GetMute' ) {
		S.mute = value;
	} else if ( cmd === 'GetConfigjson' ) {
		S.config = value;
		DEV      = S.config.devices;
		FIL      = S.config.filters;
		MIX      = S.config.mixers;
		PIP      = S.config.pipeline;
	} else if ( cmd === 'GetConfigName' ) {
		S.fileconf = value;
	} else if ( cmd === 'Invalid' ) {
		info( {
			  icon    : 'warning'
			, title   : 'Error'
			, message : data.Invalid.error
		} );
	}
}
var select2opt = { minimumResultsForSearch: 'Infinity' }
var format     = {};
[ 'S16LE', 'S24LE', 'S24LE3', 'S32LE', 'FLOAT32LE', 'FLOAT64LE', 'TEXT' ].forEach( k => format[ stringReplace( k ) ] = k );
var L  = {
	  devicetype : { capture: {}, playback: {} }
	, format     : format
	, freeasync  : {
		  keys          : [ 'sinc_len', 'oversampling_ratio', 'interpolation', 'window', 'f_cutoff' ]
		, interpolation : [ 'Cubic', 'Linear', 'Nearest' ]
		, window        : [ 'Blackman', 'Blackman2', 'BlackmanHarris', 'BlackmanHarris2', 'Hann', 'Hann2' ]
	}
	, samplerate : [ 44100, 48000, 88200, 96000, 176400, 192000, 352800, 384000, 705600, 768000, 'Other' ]
	, sampletype : [ 'Synchronous', 'FastAsync', 'BalancedAsync', 'AccurateAsync', 'FreeAsync' ]
	, sampling   : [ 'samplerate', 'chunksize', 'queuelimit', 'silence_threshold', 'silence_timeout', 'rate_measure_interval' ]
	, subtype    : {
		  Biquad      : [ 'Lowpass', 'Highpass', 'Lowshelf', 'Highshelf', 'LowpassFO', 'HighpassFO', 'LowshelfFO', 'HighshelfFO'
						, 'Peaking', 'Notch', 'Bandpass', 'Allpass', 'AllpassFO', 'LinkwitzTransform', 'Free' ]
		, BiquadCombo : [ 'ButterworthLowpass', 'ButterworthHighpass', 'LinkwitzRileyLowpass', 'LinkwitzRileyHighpass' ]
		, Conv        : [ 'Raw', 'Wave', 'Values' ]
		, Dither      : [ 'Simple', 'Uniform', 'Lipshitz441', 'Fweighted441', 'Shibata441', 'Shibata48', 'None' ]
	}
	, type       : [ 'Biquad', 'BiquadCombo', 'Conv', 'Delay', 'Gain', 'Volume', 'Loudness', 'DiffEq', 'Dither' ]
}
var Fkv = {
	  pass    : {
		  number : { freq: 1000, q: 0.5 }
	  }
	, shelf   : {
		  number : { gain: 6, freq: 1000, q: 6 }
		, radio  : [ 'Q', 'Samples' ]
	}
	, passFO  : {
		  number : { freq: 1000 }
	}
	, shelfFO : {
		  number : { gain: 6, freq: 1000 }
	}
	, notch   : {
		  number : { freq: 1000, q: 0.5 }
		, radio  : [ 'Q', 'Bandwidth' ]
	}
}
var F  = {
	  Lowpass           : Fkv.pass
	, Highpass          : Fkv.pass
	, Lowshelf          : Fkv.shelf
	, Highshelf         : Fkv.shelf
	, LowpassFO         : Fkv.passFO
	, HighpassFO        : Fkv.passFO
	, LowshelfFO        : Fkv.shelfFO
	, HighshelfFO       : Fkv.shelfFO
	, Peaking           : {
		  number : { gain: 6, freq: 1000, q: 1.5 }
		, radio  : [ 'Q', 'Bandwidth' ]
	}
	, Notch             : Fkv.notch
	, Bandpass          : Fkv.notch
	, Allpass           : Fkv.notch
	, AllpassFO         : Fkv.passFO
	, LinkwitzTransform : {
		number: { q_act: 1.5, q_target: 0.5, freq_act: 50, freq_target: 25 }
	}
	, Free              : {
		number: { a1: 0, a2: 0, b0: -1, b1: 1, b2: 0 }
	}
	, BiquadCombo       : {
		number: { order: 2, freq: 1000 }
	}
	, Raw               : { 
		  select : { filename: '', format: '' }
		, number : { skip_bytes_lines: 0, read_bytes_lines: 0 }
	}
	, Wave              : {
		  select : { filename: '' }
		, number : { channel: 0 }
	}
	, Values            : {
		  text   : { values: '1, 0, 0, 0' }
		, number : { length: 0 }
	}
	, Delay             : {
		  number   : { ms: 0 }
		, radio    : [ 'ms', 'Samples' ]
		, checkbox : { subsample: false }
	}
	, Gain              : {
		  number   : { gain: 0 }
		, checkbox : { inverted: false, mute: false }
	}
	, Volume            : {
		number: { ramp_time: 200 }
	}
	, Loudness          : {
		number: { reference_level: 5, high_boost: 5, low_boost: 5, ramp_time: 200 }
	}
	, DiffEq            : {
		text: { a: '1, 0', b: '1, 0' }
	}
	, Dither            : {
		number: { bits: 16 }
	}
}
// capture / playback
var CPkv = {
	  tc     : {
		  number : { channels: 2 }
	}
	, tcsd   : {
		  select : { device: '', format: '' }
		, number : { channels: 2 }
	}
	, wasapi : {
		  select : { device: '', format: '' }
		, number   : { channels: 2 }
		, checkbox : { exclusive: false, loopback: false }
	}
}
var CP = { // capture / playback
	  capture : {
		  Alsa      : CPkv.tcsd
		, CoreAudio : {
			  select : { device: '', format: '' }
			, number   : { channels: 2 }
			, checkbox : { change_format: false }
		}
		, Pulse     : CPkv.tcsd
		, Wasapi    : CPkv.wasapi
		, Jack      : CPkv.tc
		, Stdin     : {
			  select : { format: '' }
			, number : { channels: 2, extra_samples: 0, skip_bytes: 0, read_bytes: 0 }
		}
		, File      : {
			  select : { filename: '', format: '' }
			, number : { channels: 2, extra_samples: 0, skip_bytes: 0, read_bytes: 0 }
		}
	}
	, playback : {
		  Alsa      : CPkv.tcsd
		, CoreAudio : {
			  select   : { device: '', format: '' }
			, number   : { channels: 2 }
			, checkbox : { exclusive: false, change_format: false }
		}
		, Pulse     : CPkv.tcsd
		, Wasapi    : CPkv.wasapi
		, Jack      : CPkv.tc
		, Stdout    : {
			  select : { format: '' }
			, number : { channels: 2 }
		}
		, File      : {
			  select : { filename: '', format: '' }
			, number : { channels: 2 }
		}
	}
}
var C = {
	  cg  : '#969a9c'
	, cgd : '#313435'
	, cm  : '#33bbff'
	, cmd : '#004466'
	, or  : '#de810e'
	, ord : '#864c05'
}

$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

$( '.refresh' ).on( 'click', function() {
	info( {
		  icon         : 'camilladsp'
		, title        : 'Interface Settings'
		, checkbox     : [ 'Reset clipped samples', 'Refresh status every second' ]
		, checkchanged : true
		, ok           : () => {
			var val = infoVal();
			if ( val[ 0 ] ) ws.send( '"Reload"' );
			if ( val[ 1 ] ) {
				V.intstatus = setInterval( () => {
					wsstatus.forEach( k => ws.send( '"'+ k +'"' ) );
				}, 1000 );
			} else {
				clearInterval( V.intstatus );
			}
		}
	} );
} );
$( '#configuration' ).on( 'change', function() {
	var name = $( this ).val();
	ws.send( '{ "SetConfigName": "/srv/http/data/camilladsp/configs/'+ name +'" }' );
	ws.send( '"Reload"' );
	ws.send( '"GetConfigjson"' );
	notify( 'camilladsp', 'Configuration', 'Switch ...' );
} );
$( '#setting-configuration' ).on( 'click', function() {
	var content = '<table style="border-collapse: collapse; width: 300px;">'
	S.lsconf.forEach( f => {
		if ( f === 'default_config.yml' ) return
		
		content +=   '<tr style="border: 1px solid var( --cgl ); border-style: solid none;">'
					+'<td>'+ ico( 'file gr' ) +'</td><td>'+ f +'</td><td>'+ ico( 'remove gr' ) + ico( 'copy gr' ) +'</td>'
					+'</tr>';
	} );
	content += '<tr><td></td><td colspan="2" style="text-align: right"><a class="add">'+ ico( 'add' )+'New file</a></td></tr></table>';
	var icon  = 'camilladsp';
	var title = 'Configuration';
	info( {
		  icon        : icon
		, title       : title
		, content     : content
		, beforeshow  : () => {
			$( '#infoContent' ).on( 'click', '.add', function() {
				infoFileUpload( 'camilladsp' );
			} ).on( 'click', '.i-file, .i-copy', function() {
				var $this  = $( this );
				var rename = $this.hasClass( 'i-file' );
				var name   = rename ? $this.parent().next().text() : $this.parent().prev().text();
				info( {
					  icon         : icon
					, title        : title
					, message      : rename ? 'Rename <wh>'+ name +'</wh> to:' : 'Copy <wh>'+ name +'</wh> as:'
					, textlabel    : 'Name'
					, values       : name
					, checkblank   : true
					, checkchanged : true
					, cancel       : () => $( '#setting-configuration' ).trigger( 'click' )
					, ok           : () => {
						bash( [ rename ? 'confrename' : 'confcopy', name, infoVal(), 'CMD NAME NEWNAME' ] );
						notify( icon, title, rename ? 'Rename ...' : 'Copy ...' );
					}
				} );
			} ).on( 'click', '.i-remove', function() {
				var file = $( this ).parent().prev().text();
				info( {
					  icon    : icon
					, title   : title
					, message : 'Delete <wh>'+ file +'</wh> ?'
					, cancel  : () => $( '#setting-configuration' ).trigger( 'click' )
					, oklabel : ico( 'remove' ) +'Delete'
					, okcolor : red
					, ok      : () => {
						bash( [ 'confdelete', file, 'CMD NAME' ] );
						notify( icon, title, 'Delete ...' );
					}
				} );
			} );
		}
		, okno       : true
	} );
} );
$( '#divsettings' ).on( 'click', '.settings', function() {
	var textlabel  = L.sampling.slice( 1 );
	textlabel.push( 'Other' );
	var values     = {};
	L.sampling.forEach( k => values[ k ] = DEV[ k ] );
	if ( ! L.samplerate.includes( DEV.samplerate ) ) values.samplerate = 'Other';
	values.other = values.samplerate;
	var icon  = 'devices';
	var title = 'Devices';
	info( {
		  icon         : icon
		, title        : title
		, selectlabel  : 'Sample Rate'
		, select       : L.samplerate
		, textlabel    : labelArraySet( textlabel )
		, boxwidth     : 120
		, order        : [ 'select', 'text' ]
		, values       : values
		, checkblank   : true
		, checkchanged : true
		, beforeshow   : () => {
			$( '.trselect' ).after( $( 'tr' ).last() );
			var $trother = $( '.trtext' ).eq( 0 );
			$trother.toggleClass( 'hide', values.samplerate !== 'Other' );
			$( '.trselect select' ).on( 'change', function() {
				otherToggle( $trother, $( this ).val() );
			} );
		}
		, ok           : () => {
			var val = infoVal();
			if ( val.samplerate === 'Other' ) val.samplerate = val.other;
			delete val.other;
			$.each( val, ( k, v ) => DEV[ k ] = v );
			saveConfig( icon, title, 'Change ...' );
		}
	} );
} ).on( 'click', '.i-info-circle', function() { // pipeline
	var $li = $( '#divpipeline li' ).eq( 0 );
	if ( $li.hasClass( 'hide' ) ) {
		if ( $li.is( ':empty' ) ) {
			bash( [ 'plot', 'pipeline', 'all', 'CMD TYPE TARGET' ], svg => {
				$li
					.html( svg )
					.removeClass( 'hide' );
			} );
		} else {
			$li.removeClass( 'hide' );
		}
	} else {
		$li.addClass( 'hide' );
	}
} );
$( '#setting-capture' ).on( 'click', function() {
	infoDevices( 'capture' );
} )
$( '#setting-playback' ).on( 'click', function() {
	infoDevices( 'playback' );
} );
$( '#setting-enable_rate_adjust' ).on( 'click', function() {
	var icon  = 'devices';
	var title = 'Rate Adjust';
	info( {
		  icon         : icon
		, title        : title
		, numberlabel  : [ 'Adjust period', 'Target level' ]
		, boxwidth     : 100
		, values       : { adjust_period: DEV.adjust_period, target_level: DEV.target_level }
		, checkchanged : DEV.enable_rate_adjust
		, cancel       : switchCancel
		, ok           : () => {
			var val =  infoVal();
			[ 'adjust_period', 'target_level' ].forEach( k => DEV[ k ] = val[ k ] );
			DEV.enable_rate_adjust = true;
			saveConfig( icon, title, DEV.enable_rate_adjust ? 'Change ...' : 'Enable ...' );
		}
	} );
} );
$( '#setting-enable_resampling' ).on( 'click', function() {
	infoResampling( DEV.resampler_type === 'FreeAsync' );
} );
$( '#stop_on_rate_change' ).on( 'click', function() {
	DEV.stop_on_rate_change = $( this ).prop( 'checked' );
	saveConfig( 'devices', 'Stop on Rate Change', 'Change ...' );
} );
$( '.headtitle' ).on( 'click', '.i-add', function() {
	var id = $( this ).parent().text().toLowerCase();
	if ( id === 'filters' ) {
		infoFilters( 'Biquad', 'Lowpass' );
	} else if ( id === 'mixers' ) {
		infoMixer();
	} else if ( id === 'pipeline' ) {
		infoPipeline();
	}
} ).on( 'click', '.mixer-icon', function() {
	infoMapping();
} );
$( '#divfilters' ).on( 'click', 'li .name', function() {
	infoFilters( '', $( this ).text() );
} ).on( 'click', 'li i', function( e ) {
	var $this  = $( this );
	var $li    = $this.parents( 'li' );
	var action = $this.prop( 'class' ).slice( 2 );
	var name   = $this.parents( 'li' ).data( 'name' );
	var file   = $this.parents( 'li' ).find( '.i-file' ).length;
	var icon   = 'filters';
	var title  = file ? 'Filter File' : 'Filter';
	if ( action === 'graph' ) {
		var $ligraph = $li.next();
		if ( $ligraph.hasClass( 'hide' ) ) {
			graphResponse( name, $ligraph );
		} else {
			$ligraph.addClass( 'hide' );
		}
	} else if ( action === 'file' ) {
		info( {
			  icon         : icon
			, title        : title
			, message      : 'Rename <wh>'+ name +'</wh> to:'
			, textlabel    : 'Name'
			, values       : name
			, checkblank   : true
			, checkchanged : true
			, ok           : () => { // in filters Conv
				var newname    = infoVal();
				bash( [ 'coeffrename', name, newname, 'CMD NAME NEWNAME' ] );
				$.each( FIL, ( k, v ) => {
					if ( v.type === 'Conv' && v.parameters.filename === name ) FIL[ name ].parameters.filename = newname;
				} );
				saveConfig( icon, title, 'Rename ...' );
			}
		} );
	} else if ( action === 'remove' ) {
		if ( file ) {
			var deletefilter = false;
			$.each( FIL, ( k, v ) => {
				if ( v.parameters.filename === name ) deletefilter = k;
			} );
		}
		info( {
			  icon    : icon
			, title   : title
			, message : 'Delete <wh>'+ name +'</wh> ?'
					+ ( deletefilter ? '<br><br>(Filter <wh>'+ deletefilter +'</wh> will be deleted as well.)' : '' )
			, oklabel : ico( 'remove' ) +'Delete'
			, okcolor : red
			, ok      : () => {
				if ( file ) { // in filters Conv
					if ( deletefilter ) delete FIL[ deletefilter ];
					bash( [ 'coeffdelete', name, 'CMD NAME' ] );
					notify( icon, title, 'Delete ...' );
				} else {
					PIP.forEach( ( k, i ) => {
						if ( k.type === 'Filter' ) {
							k.names.forEach( ( n, ni ) => {
								if ( n === name ) PIP[ i ].names[ ni ] = newname;
							} );
						}
					} );
					delete FIL[ name ];
					if ( $li.next().hasClass( 'ligraph' ) ) $li.next().remove();
				}
				$li.remove();
				saveConfig( icon, title, 'Delete ...' );
			}
		} );
	} else if ( action === 'add' ) {
		infoFileUpload( 'filters' );
	}
} ).on( 'keyup', 'input[type=number]', function() {
	var $this = $( this );
	$this.next().val( +$this.val() );
} ).on( 'click input keyup', 'input[type=range]', function() {
	var $this = $( this );
	var val   = +$this.val();
	$this.prev().val( dbFormat( val ) );
	if ( $this.hasClass( 'range' ) ) {
		ws.send( '{ "SetVolume": '+ val +' }' );
	} else {
		var $li  = $this.parents( 'li' );
		var name = $li.data( 'name' );
		FIL[ name ].parameters.gain = val;
		saveConfig();
		if ( ! $li.next().hasClass( 'hide' ) ) graphResponse( name, $li );
	}
} ).on( 'click', '.mutemain', function() {
	var $this = $( this );
	S.mute    = ! S.mute;
	$this
		.toggleClass( 'infobtn-primary', S.mute )
		.find( 'i' )
			.toggleClass( 'i-mute', S.mute )
			.toggleClass( 'i-volume', ! S.mute );
	ws.send( '{ "SetMute": '+ S.mute +'} ' );
} );
$( '#divmixers' ).on( 'click', 'li', function( e ) {
	var $this     = $( this );
	if ( $this.hasClass( 'lihead' ) || $( '#divmixers .liinput' ).length || $( e.target ).is( 'i' ) ) return
	
	if ( ! $this.find( '.i-mixers' ).length ) {
		var name  = $this.data( 'name' );
		var index = $this.data( 'index' );
		var kv    = jsonClone( MIX[ name ].mapping[ index ] );
		var li    =  '<li class="lihead">Destination '+ ico( 'add' ) + ico( 'back' ) +'</li>'
					+'<li class="liinput head"><div>Channel</div><div>Gain</div><div>Mute</div><div>Invert</div></li>';
		kv.sources.forEach( s => {
			li += '<li class="liinput"><div>'+ s.channel +'</div><div>'+ s.gain +'</div><div>'+ s.mute +'</div><div>'+ s.inverted +'</div></li>';
		} );
		$( '#divmixers .entries' ).html( li );
		return
	}
	
	V.mixers      = $this.index();
	var name      = $this.find( '.li1' ).text();
	var data      = jsonClone( MIX[ name ].mapping );
	var chmapping = data.length;
	var chin      = DEV.capture.channels;
	var chout     = DEV.playback.channels;
	var iconadd   = chout === chmapping ? '' : ico( 'add' );
	var li        = '<li class="lihead" data-name="'+ name +'">'+ ico( 'mixers' ) + name + iconadd + ico( 'back' ) +'</li>';
	var optsource = htmlOption( chin );
	data.forEach( ( kv, i ) => {
		var dest   = kv.dest;
		var i_name = ' data-index="'+ i +'" data-name="'+ name +'"';
		li        += '<div class="divdest">'
					+'<li class="liinput main"'+ i_name +' data-dest="'+ dest +'">'
					+'<div>Dest.</div><div>'+ dest +'</div>'
					+'<input type="range" class="hidden">'
					+'<input type="checkbox" class="mutedest"'+ ( kv.mute ? ' checked' : '' ) +'>'
					+'<input type="checkbox" class="hidden">'+ ico( 'remove' )
					+'</li>'
					+'<li class="liinput column"'+ i_name +'><div>Source</div><div></div><div>Gain</div><div>Mute</div><div>Invert</div>'+ ico( 'add' ) +'</li>';
		kv.sources.forEach( ( s, si ) => {
			var source   = data[ i ].sources[ si ];
			var channel = source.channel;
			var opts    = optsource.replace( '>'+ channel, ' selected>'+ channel );
			var step_val =  ' step="0.1" value="'+ dbFormat( source.gain ) +'"';
			li += '<li class="liinput"'+ i_name +'" data-si="'+ si +'"><select>'+ opts +'</select>'
				 +'<input type="number"'+ step_val +'>'
				 +'<input type="range"'+ step_val +' min="-6" max="6">'
				 +'<input type="checkbox" class="mute"'+ ( source.mute ? ' checked' : '' ) +'>'
				 +'<input type="checkbox"'+ ( source.inverted ? ' checked' : '' ) +'>'+ ico( 'remove' ) +'</li>';
		} );
		li      += '</div>';
	} );
	$( '#divmixers .entries' ).html( li );
	$( '#divmixers .entries select' ).select2( select2opt );
} ).on( 'click', 'li i', function() {
	var $this  = $( this );
	var $li    = $this.parents( 'li' );
	var action = $this.prop( 'class' ).slice( 2 );
	var main   = ! $( '#divmixers .lihead' ).length;
	var name   = $li.data( 'name' );
	if ( action === 'mixers' ) { // rename
		infoMixer( name );
	} else if ( action === 'back' ) {
		$( '#divmixers .lihead' ).remove();
		$( '#mixers' ).trigger( 'click' );
	} else if ( action === 'add' ) {
		var index = $li.hasClass( 'lihead' ) ? '' : $li.data( 'index' );
		infoMapping( name, index );
	} else if ( action === 'remove' ) {
		var dest = $li.hasClass( 'liinput main' );
		if ( main ) {
			var message = 'Delete <wh>'+ name +'</wh> ?';
		} else if ( dest ) {
			var message = 'Delete this destination?';
		} else {
			var message = 'Delete this source?';
		}
		info( {
			  icon    : 'mixers'
			, title   : 'Mixer'
			, message : message
			, ok      : () => {
				if ( main ) {
					delete MIX[ name ];
					if ( $li.next().hasClass( 'ligraph' ) ) $li.next().remove();
					$li.remove();
				} else {
					var di = $li.data( 'dest' );
					if ( dest ) {
						$li.parent().remove();
						delete MIX[ name ].mapping.splice( di, 1 );
						PIP.forEach( ( k, i ) => {
							if ( k.type === 'Mixer' && k.name === name ) delete PIP[ i ];
						} );
					} else {
						$li.remove();
						MIX[ name ].mapping[ di ].sources.splice( $li.data( 'index' ), 1 );
					}
				}
				saveConfig( 'mixers', 'Mixer', 'Remove ...' );
			}
		} );
	}
} ).on( 'keyup', 'input[type=number]', function() {
	var $this = $( this );
	$this.next().val( +$this.val() );
} ).on( 'click input keyup', 'input[type=range]', function() {
	var $this = $( this );
	var val   = +$this.val();
	$this.prev().val( dbFormat( val ) );
	var $li   = $( this ).parents( 'li' );
	var name  = $li.data( 'name' );
	var index = $li.data( 'index' );
	var si    = $li.data( 'si' );
	MIX[ name ].mapping[ index ].sources[ si ].gain = val;
	saveConfig();
} ).on( 'click', 'li input:checkbox', function() {
	var $this   = $( this );
	var $li     = $this.parents( 'li' );
	var mapping = MIX[ $li.data( 'name' ) ].mapping[ $li.data( 'index' ) ];
	var tf      = $this.prop( 'checked' );;
	if ( $this.hasClass( 'mutedest' ) ) {
		mapping.mute = tf;
	} else {
		var source = mapping.sources[ $li.data( 'si' ) ];
		if ( $this.hasClass( 'mute' ) ) {
			source.mute = tf;
		} else {
			source.inverted = tf;
		}
	}
	saveConfig( 'mixers', 'Mute', 'change ...' );
} );
$( '#divpipeline' ).on( 'click', 'li', function( e ) {
	var $this  = $( this );
	if ( $( '#divpipeline .lihead' ).length || $( e.target ).is( 'i' ) ) return
	
	var index  = $this.data( 'index' );
	V.pipeline = index;
	var data   = jsonClone( PIP[ index ] );
	var type   = data.type;
	var li     = '<li class="lihead" data-index="'+ index +'">Channel '+ data.channel + ico( 'add' ) + ico( 'back' ) +'</li>';
	if ( type === 'Filter' ) {
		var removehide = data.names.length === 1 ? ' hide' : '';
		data.names.forEach( ( name, i ) => {
			li += '<li data-index="'+ i +'" data-name="'+ name +'">'+ ico( 'filters' ) + ico( 'remove'+ removehide ) + name +'</li>';
		} );
		$( '#divpipeline .entries' ).html( li );
		pipelineSort();
	} else {
		var names  = Object.keys( MIX );
		if ( names.length === 1 ) return
		
		var values = $this.find( '.li2' ).text();
		info( {
			  icon    : 'pipeline'
			, title   : 'Pipeline'
			, message : values
			, select  : names
			, values  : values
			, ok      : () => {
				PIP[ index ].name = infoVal();
				saveConfig( 'pipeline', 'Add Mixer' );
			}
		} );
	}
} ).on( 'click', 'li i', function() {
	var $this  = $( this );
	var $li    = $this.parents( 'li' );
	var index  = $li.data( 'index' );
	var action = $this.prop( 'class' ).slice( 2 );
	if ( action === 'graph' ) {
		var $ligraph = $li.next();
		if ( $ligraph.hasClass( 'hide' ) ) {
			graphResponse( index, $ligraph );
		} else {
			$ligraph.addClass( 'hide' );
		}
	} else if ( action === 'back' ) {
		$( '#divpipeline .lihead' ).remove();
		$( '#pipeline' ).trigger( 'click' );
	} else if ( action === 'add' ) {
		var icon  = 'pipeline';
		var title = 'Add Filter';
		info( {
			  icon        : icon
			, title       : title
			, selectlabel : 'Filter'
			, select      : Object.keys( FIL )
			, ok          : () => {
				PIP[ index ].names.push( infoVal() );
				saveConfig( icon, title, 'Save ...' );
			}
		} );
	} else if ( action === 'remove' ) {
		var main = ! $( '#divpipeline .lihead' ).length;
		info( {
			  icon    : 'pipeline'
			, title   : 'Pipeline'
			, message : main ? 'Delete this filter?' : 'Delete <wh>'+ $li.data( 'name' ) +'</wh> ?'
			, ok      : () => {
				if ( main ) {
					PIP.splice( index, 1 );
				} else {
					var pi = $( '#divpipeline .lihead' ).data( 'index' );
					var ni = $li.data( 'index' );
					PIP[ pi ].names.splice( ni, 1 );
				}
				$li.remove();
				saveConfig( 'pipeline', 'Pipeline', 'Remove filter ...' );
			}
		} );
	}
} );
$( '#bar-bottom div' ).on( 'click', function() {
	V.currenttab = this.id;
	renderTab();
} );

} ); // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

function dbFormat( num ) {
	return num % 1 === 0 ? num + '.0' : num
}
function deviceKeys( dev, type ) {
	var key_val = CP[ dev ][ type ];
	var keys    = [ 'type' ];
	$.each( key_val, ( k, v ) => keys = [ ...keys, ...Object.keys( v ) ] );
	return keys
}
function graphResponse( val, $li ) {
	var type  = V.currenttab;
	notify( type, key2label( type ), 'Plot ...' );
	bash( [ 'settings/camilla.py', type +' '+ val ], data => {
		var gain  = {
			  y    : data.magnitude
			, type : 'scatter'
			, line : {
				  width : 2
				, color: C.cm
			}
		}
		var phase = {
			  y     : data.phase
			, yaxis : 'y2'
			, type  : 'scatter'
			, line : {
				  width : 2
				, color: C.or
			}
		}
		var layout = {
			  xaxis      : {
				  title         : {
					  text     : 'Frequency (Hz)'
					, standoff : 10
				}
				, tickvals      : V.currenttab === 'filters' ? [ '', 232, 463, 695, 925 ] : [ '', '', 300, 600, 916 ]
				, ticktext      : [ 0, 10, 100, '1k', '10k' ]
				, gridcolor     : C.cgd
			}
			, yaxis      : {
				  title        : {
					  text     : 'Gain (dB)'
					, standoff : 5
				}
				, tickfont      : { color: C.cm }
				, autorange     : true
				, zerolinecolor : C.cg
				, linecolor     : C.cmd
				, gridcolor     : C.cmd
			}
			, yaxis2     : {
				  title      : {
					  text     : 'Phase (°)'
					, standoff : 10
				}
				, tickfont      : { color: C.or }
				, overlaying    : 'y'
				, side          : 'right'
				, range         : [ -180, 180 ]
				, linecolor     : C.ord
				, gridcolor     : C.ord
			}
			, width      : 658
			, height     : 300
			, margin     : { t: 0, r: 60, b: 90, l: 60 }
			, font       : {
				  family : 'Inconsolata'
				, size   : 14
				, color  : C.cg
			}
			, paper_bgcolor : '#000'
			, plot_bgcolor  : '#000'
			, showlegend    : false
		}
		if ( typeof( Plotly ) !== 'object' ) {
			$.getScript( '/assets/js/plugin/'+ jfiles.plotly, function() {
				graphResponse( val, $li );
			} );
			return
		}
		Plotly.newPlot( $li[ 0 ], [ gain, phase ], layout, { displayModeBar: false } );
		$li.removeClass( 'hide' );
		bannerHide();
	}, 'json' );
}
function htmlOption( list ) {
	if ( typeof( list ) === 'number' ) list = [ ...Array( list ).keys() ];
	var options = '';
	list.forEach( k => options += '<option>'+ k +'</option>' );
	return options
}
function infoDevices( dev, type ) {
	var key_val, kv, k, v;
	var data        = jsonClone( DEV[ dev ] );
	var type        = type || data.type;
	// select
	var selectlabel = [ 'type' ];
	var select      = [ L.devicetype[ dev ] ];
	var values      = { type: type }
	key_val         = CP[ dev ][ type ];
	if ( 'select' in key_val ) {
		kv          = jsonClone( key_val.select );
		k           = Object.keys( kv );
		k.forEach( key => {
			if ( key === 'format' ) {
				var s = L.format;
				var v = { format: data.format };
			} else if ( key === 'device' ) {
				var s = S.device;
				var v = { device: data.device };
			} else if ( key === 'filename' ) {
				var s   = S.lscoef.length ? S.lscoef : [ '(n/a)' ];
				var v   = { filename: data.filename };
			}
			selectlabel = [ ...selectlabel, key ];
			select      = [ ...select, s ];
			values      = { ...values, ...v };
		} );
	}
	selectlabel     = labelArraySet( selectlabel );
	// text
	var textlabel = false;
	if ( 'text' in key_val ) {
		kv        = jsonClone( key_val.text );
		k         = Object.keys( kv );
		textlabel = labelArraySet( k );
		k.forEach( key => {
			if ( key in data ) kv[ key ] = data[ key ];
		} );
		values    = { ...values, ...kv };
	}
	// number
	var numberlabel = false;
	if ( 'number' in key_val ) {
		kv          = jsonClone( key_val.number );
		k           = Object.keys( kv );
		numberlabel = labelArraySet( k );
		k.forEach( key => {
			if ( key in data ) kv[ key ] = data[ key ];
		} );
		values      = { ...values, ...kv };
	}
	// checkbox
	var checkbox    = false;
	if ( 'checkbox' in key_val ) {
		kv       = jsonClone( key_val.checkbox );
		k        = Object.keys( kv );
		checkbox = labelArraySet( k );
		k.forEach( key => {
			if ( key in data ) kv[ key ] = data[ key ];
		} );
		values   = { ...values, ...kv };
	}
	$.each( v, ( k, v ) => values[ k ] = v );
	var icon  = 'devices';
	var title = key2label( dev ) +' Device';
	info( {
		  icon         : icon
		, title        : title
		, selectlabel  : selectlabel
		, select       : select
		, textlabel    : textlabel
		, numberlabel  : numberlabel
		, checkbox     : checkbox
		, boxwidth     : 198
		, order        : [ 'select', 'text', 'number', 'checkbox' ]
		, values       : values
		, checkblank   : true
		, checkchanged : type === data.type
		, beforeshow   : () => {
			$( '#infoContent input[type=number]' ).css( 'width', '70px' );
			$( '#infoContent td:first-child' ).css( 'width', '128px' );
			var $select = $( '#infoContent select' );
			$select.eq( 0 ).on( 'change', function() {
				infoDevices( dev, $( this ).val() );
			} );
		}
		, ok           : () => {
			var val = infoVal();
			$.each( val, ( k, v ) => DEV[ dev ][ k ] = v );
			saveConfig( icon, title, 'Change ...' );
		}
	} );
}
function infoFileUpload( icon ) {
	if ( icon === 'filters' ) {
		var title   = 'Add Filter File';
		var cmd     = 'camillacoeffs';
		var message = 'Upload filter file:';
	} else {
		var title   = 'Add Configuration';
		var cmd     = 'camillaconfigs';
		var message = 'Upload configuration file:'
	}
	info( {
		  icon        : icon
		, title       : title
		, message     : message
		, fileoklabel : ico( 'file' ) +'Upload'
		, cancel      : () => icon === 'filters' ? '' : $( '#setting-configuration' ).trigger( 'click' )
		, ok          : () => {
			notify( icon, title, 'Upload ...' );
			var formdata = new FormData();
			formdata.append( 'cmd', cmd );
			formdata.append( 'file', I.infofile );
			fetch( 'cmd.php', { method: 'POST', body: formdata } )
				.then( response => response.text() )
				.then( message => {
					if ( message ) {
						bannerHide();
						infoWarning(  icon,  title, message );
					}
				} );
		}
	} );
}
function infoFilters( type, subtype, name ) {
	var key_val, key, kv, k, v;
	if ( ! type ) { // subtype = existing name
		name     = subtype;
		var data = jsonClone( FIL[ name ] );
		v        = { type : data.type }
		$.each( data.parameters, ( key, val ) => v[ key === 'type' ? 'subtype' : key ] = val );
		type     = v.type;
		subtype  = v.subtype;
	}
	// select
	var selectlabel = [ 'type' ];
	var select      = [ L.type ];
	var values      = { type: type }
	if ( subtype ) {
		selectlabel.push( 'subtype' )
		select.push( L.subtype[ type ] );
		values.subtype = subtype;
		key_val        = F[ subtype ];
	}
	if ( ! key_val ) key_val = F[ type ];
	if ( subtype === 'Uniform' ) key_val.amplitude = 1;
	if ( 'select' in key_val ) {
		kv          = jsonClone( key_val.select );
		k           = Object.keys( kv );
		selectlabel = [ ...selectlabel, ...k ];
		subtype     = subtype === 'Raw' ? [ S.lscoef, L.format ] : [ S.lscoef ];
		select      = [ ...select, ...subtype ];
		if ( v ) k.forEach( key => kv[ key ] = v[ key ] );
		values      = { ...values, ...kv };
	}
	selectlabel     = labelArraySet( selectlabel );
	// text
	var textlabel   = [ 'name' ];
	values.name     = name;
	if ( 'text' in key_val ) {
		kv        = jsonClone( key_val.text );
		k         = Object.keys( kv );
		textlabel = [ ...textlabel, ...k ];
		if ( v ) k.forEach( key => kv[ key ] = v[ key ] );
		values    = { ...values, ...kv };
	}
	textlabel       = labelArraySet( textlabel );
	// number
	var numberlabel = false;
	if ( 'number' in key_val ) {
		kv          = jsonClone( key_val.number );
		k           = Object.keys( kv );
		numberlabel = k;
		if ( v ) {
			k.forEach( key => {
				if ( [ 'q', 'samples' ].includes( key ) ) {
					if ( ! ( 'q' in v ) ) {
						delete kv.q;
						key = 'samples';
					}
					numberlabel[ numberlabel.length - 1 ] = key;
				}
				kv[ key ] = v[ key ];
			} );
		}
		values      = { ...values, ...kv };
		numberlabel = labelArraySet( numberlabel );
	}
	// radio - q / samples
	var radio       = false;
	if ( 'radio' in key_val ) {
		radio  = key_val.radio;
		values = { ...values, radio: numberlabel[ numberlabel.length - 1 ] };
	}
	// checkbox
	var checkbox    = false;
	if ( 'checkbox' in key_val ) {
		kv       = jsonClone( key_val.checkbox );
		k        = Object.keys( kv );
		checkbox = labelArraySet( k );
		if ( v ) k.forEach( key => kv[ key ] = v[ key ] );
		values   = { ...values, ...kv };
	}
	var icon        = 'filters';
	var title       = name ? 'Filter' : 'New Filter';
	info( {
		  icon         : icon
		, title        : title
		, selectlabel  : selectlabel
		, select       : select
		, textlabel    : textlabel
		, numberlabel  : numberlabel
		, radio        : radio
		, radiosingle  : true
		, checkbox     : checkbox
		, boxwidth     : 198
		, order        : [ 'select', 'text', 'number', 'radio', 'checkbox' ]
		, values       : values
		, checkblank   : true
		, checkchanged : name
		, beforeshow   : () => {
			$( '#infoContent td:first-child' ).css( 'min-width', '125px' );
			var $tdname = $( '#infoContent td' ).filter( function() {
				return $( this ).text() === 'Name'
			} );
			$( '#infoContent tr' ).eq( 0 ).before( $tdname.parent() );
			var $select     = $( '#infoContent select' );
			var $selecttype = $select.eq( 0 );
			$selecttype.on( 'change', function() {
				var type    = $( this ).val();
				var subtype = type in L.subtype ? L.subtype[ type ][ 0 ] : '';
				infoFilters( type, subtype, infoVal().name );
			} );
			if ( $select.length > 1 ) {
				$select.eq( 1 ).on( 'change', function() {
					var type    = $selecttype.val();
					var subtype = $( this ).val();
					infoFilters( type, subtype );
				} );
			}
			if ( radio ) {
				var $tr      = $( '#infoContent .trradio' ).prev();
				var itr      = $tr.index()
				var $label   = $tr.find( 'td' ).eq( 0 );
				var $radio   = $( '#infoContent input:radio' );
				$radio.on( 'change', function() {
					var val       = $( this ).filter( ':checked' ).val();
					I.keys[ itr ] = val.toLowerCase();
					$label.text( val );
				} );
			}
		}
		, ok           : () => {
			var val     = infoVal();
			name        = val.name;
			type        = val.type;
			var param   = { type: val.subtype };
			[ 'name', 'type', 'subtype', 'radio' ].forEach( k => delete val[ k ] );
			$.each( val, ( k, v ) => param[ k ] = v );
			FIL[ name ] = { type: type, parameters : param }
			saveConfig( icon, title, name ? 'Change ...' : 'Save ...' );
		}
	} );
}
function infoMapping( name, index ) {
	var option = {
		  dest   : htmlOption( DEV.playback.channels )
		, source : htmlOption( DEV.capture.channels )
	}
	var trdest   = `
<tr class="trsource">
	<td><select data-k="dest">${ option.dest }</select></td>
</tr>
<tr style="height: 10px"></tr>
`;
	var trsource = `
<tr class="trhead">
	<td>Source</td><td>Gain</td><td>Mute</td><td>Invert</td>
</tr>
<tr style="height: 10px"></tr>
<tr class="trsource">
	<td><select data-k="channel">${ option.source }</select></td><td><input type="number" data-k="gain" value="0"></td>
	<td><input type="checkbox" data-k="mute"></td><td><input type="checkbox" data-k="inverted">
</tr>
`;
	
	var icon  = 'mixers';
	if ( index === '' ) {
		var title = 'New Destination';
		info( {
			  icon         : icon
			, title        : title
			, content      : '<table class="tablemapping">'+ trdest + trsource +'</table>'
			, contentcssno : true
			, values       : [ MIX[ name ].mapping.length, 0, 0, false, false ]
			, checkblank   : true
			, ok           : () => {
				var s = {}
				$( '.trsource' ).find( 'select, input' ).each( ( i, el ) => {
					var $this = $( el )
					s[ $this.data( 'k' ) ] = $this.is( ':checkbox' ) ? $this.prop( 'checked' ) : +$this.val();
				} );
				var mapping = {
					  dest    : +$( '.trsource select' ).val()
					, mute    : false
					, sources : [ s ]
				}
				MIX[ name ].mapping.push( mapping );
				saveConfig( icon, title, 'Save ...' );
			}
		} );
	} else {
		var title = 'New Source';
		info( {
			  icon         : icon
			, title        : title
			, content      : '<table class="tablemapping">'+ trsource +'</table>'
			, contentcssno : true
			, values       : [ 0, 0, false, false ]
			, checkblank   : true
			, ok           : () => {
				var s = {}
				$( '.trsource' ).find( 'select, input' ).each( ( i, el ) => {
					var $this = $( el )
					s[ $this.data( 'k' ) ] = $this.is( ':checkbox' ) ? $this.prop( 'checked' ) : +$this.val();
				} );
				MIX[ name ].mapping[ index ].sources.push( s );
				saveConfig( icon, title, 'Save ...' );
			}
		} );
	}
}
function infoMixer( name ) {
	var icon  = 'mixers';
	var title = name ? 'Mixer' : 'New Mixer'
	info( {
		  icon         : icon
		, title        : title
		, message      : name ? 'Rename <wh>'+ name +'</wh> to:' : ''
		, textlabel    : 'Name'
		, values       : name
		, checkblank   : true
		, checkchanged : name
		, ok           : () => {
			var val = infoVal();
			if ( val in MIX ) {
				info( {
					  icon    : 'mixers'
					, title   : 'New Mixer'
					, message : 'Mixer: <wh>'+ val +'</wh> already exists.'
					, ok      : () => infoMixer( val )
				} );
				return
			}
			
			if ( name ) {
				var mixer = jsonClone( MIX[ name ] );
				delete MIX[ name ];
			} else {
				var mixer = {
					  channels : {
						  in  : DEV.capture.channels
						, out : DEV.playback.channels
					}
					, mapping  : [ {
						  dest    : 0
						, sources : [ {
							  channel  : 0
							, gain     : 0
							, inverted : false
							, mute     : false
						} ]
						, mute    : false
					} ]
				}
			}
			MIX[ val ] = mixer;
			saveConfig( icon, title, name ? 'Change ...' : 'Save ...' );
		}
	} );
}
function infoPipeline() {
	var icon  = 'pipeline';
	var title = 'New Pipeline';
	var filters = Object.keys( FIL );
	info( {
		  icon        : icon
		, title       : title
		, tablabel    : [ ico( 'filters' ) +' Filter', ico( 'mixers' ) +' Mixer' ]
		, tab         : [ '', infoPipelineMixer ]
		, selectlabel : [ 'Channel', 'Filters' ]
		, select      : [ [ ...Array( DEV.playback.channels ).keys() ], filters ]
		, beforeshow  : () => {
			$( '#infoContent .select2-container' ).eq( 0 ).addClass( 'channel' )
			$( '#infoContent td' ).last().append( ico( 'add' ) );
			var tradd = '<tr class="trlist"><td></td><td><input type="text" disabled value="VALUE">'+ ico( 'remove' ) +'</td></tr>';
			$( '#infoContent' ).on( 'click', '.i-add', function() {
				$( '#infoContent table' ).append( tradd.replace( 'VALUE', $( '#infoContent select' ).eq( 1 ).val() ) );
			} ).on( 'click', '.i-remove', function() {
				$( this ).parents( 'tr' ).remove();
			} );
		}
		, ok          : () => {
			var $input = $( '#infoContent input' );
			if ( $input.length ) {
				var names = [];
				$input.each( ( i, el ) => names.push( $( el ).val() ) );
			} else {
				var names = filters[ 0 ];
			}
			PIP.push( {
				  type    : 'Filter'
				, channel : +$( '#infoContent select' ).eq( 0 ).val()
				, names   : names
			} );
			saveConfig( icon, titlle, 'Save ...' )
		}
	} );
}
function infoPipelineMixer() {
	var icon  = 'pipeline';
	var title = 'New Pipeline';
	info( {
		  icon         : icon
		, title        : title
		, tablabel     : [ ico( 'filters' ) +' Filter', ico( 'mixers' ) +' Mixer' ]
		, tab          : [ infoPipeline, '' ]
		, selectlabel  : 'Mixers'
		, select       : Object.keys( MIX )
		, ok          : () => {
			PIP.push( {
				  type : 'Mixer'
				, name : infoVal()
			} );
			saveConfig( icon, titlle, 'Save ...' )
		}
	} );
}
function infoResampling( freeasync ) {
	var selectlabel = [ 'Resampler type', 'Capture samplerate' ];
	var select      = [ L.sampletype, L.samplerate ];
	var numberlabel = [ 'Other' ];
	var values      = {};
	[ 'resampler_type', 'capture_samplerate' ].forEach( k => values[ k ] = DEV[ k ] );
	if ( ! L.samplerate.includes( DEV.capture_samplerate ) ) values.capture_samplerate = 'Other';
	values.other = values.capture_samplerate;
	if ( freeasync ) {
		selectlabel.push( 'interpolation', 'window' );
		select.push( L.freeasync.interpolation, L.freeasync.window );
		numberlabel.push( 'Sinc length', 'Oversampling ratio', 'Frequency cutoff' );
		var f  = DEV.resampler_type.FreeAsync || {};
		values = {
			  resampler_type     : 'FreeAsync'
			, capture_samplerate : values.capture_samplerate
			, interpolation      : f.interpolation      || 'Linear'
			, window             : f.window             || 'Blackman2'
			, other              : values.capture_samplerate
			, sinc_len           : f.sinc_len           || 128
			, oversampling_ratio : f.oversampling_ratio || 1024
			, f_cutoff           : f.f_cutoff           || 0.925
		}
	}
	var icon  = 'devices'
	var title = 'Resampling'
	info( {
		  icon         : icon
		, title        : title
		, selectlabel  : selectlabel
		, select       : select
		, numberlabel  : numberlabel
		, boxwidth     : 160
		, order        : [ 'select', 'number' ]
		, values       : values
		, checkchanged : DEV.enable_resampling
		, beforeshow   : () => {
			var $trnumber = $( '.trnumber' );
			var $trother = $trnumber.eq( 0 );
			var indextr  = freeasync ? [ 2, 1, 0 ] : [ 0 ]
			indextr.forEach( i => $( '.trselect' ).eq( 1 ).after( $trnumber.eq( i ) ) );
			$trother.toggleClass( 'hide', values.capture_samplerate !== 'Other' );
			$( '.trselect select' ).eq( 0 ).on( 'change', function() {
				if ( $( this ).val() === 'FreeAsync' ) {
					infoResampling( 'freeasync' );
				} else if ( $trnumber.length > 1 ) {
					infoResampling();
				}
			} );
			$( '.trselect select' ).eq( 1 ).on( 'change', function() {
				otherToggle( $trother, $( this ).val() );
			} );
		}
		, cancel       : switchCancel
		, ok           : () => {
			var val = infoVal();
			if ( val.capture_samplerate === 'Other' ) val.capture_samplerate = val.other;
			[ 'resampler_type', 'capture_samplerate' ].forEach( k => DEV[ k ] = val[ k ] );
			if ( freeasync ) {
				var v = {}
				L.freeasync.keys.forEach( k => v[ k ] = val[ k ] );
				DEV.resampler_type = { FreeAsync: v }
			}
			DEV.enable_resampling = true;
			saveConfig( icon, title, 'Change ...' );
		}
	} );
}
function key2label( key ) {
	if ( key === 'ms' ) return 'ms'
	
	var str = key[ 0 ].toUpperCase();
	if ( key.length === 1 ) return str
	
	key = key
			.replace( '_act',        ' actual' )
			.replace( '_len',        ' length' )
			.replace( 'bytes_lines', 'bytes/lines' )
			.replace( 'chunksize',   'chunk size' )
			.replace( 'f_',          'freq ' )
			.replace( 'queuelimit',  'queue limit' )
			.replace( 'samplerate',  'sample rate' )
			.replace( /_/g,          ' ' )
			.replace( 'freq',        'frequency' )
			.slice( 1 )
	return str + key
}
function labelArraySet( array ) {
	var capitalized = array.map( el => key2label( el ) );
	return capitalized
}
function otherToggle( $trother, rate ) {
	var other = rate === 'Other';
	$trother.toggleClass( 'hide', ! other );
	if ( ! other ) $trother.find( 'input' ).val( rate );
}
function pipelineOrder( array, ai, bi ) {
	var a = array[ ai ];
	array.splice( ai, 1 );
	array.splice( bi, 0, a );
}
function pipelineSort() {
	if ( 'sortable' in V ) V.sortable.destroy();
	V.sortable = new Sortable( $( '#divpipeline .entries' )[ 0 ], {
		  ghostClass    : 'sortable-ghost'
		, delay         : 400
		, onUpdate      : function ( e ) {
			var ai = e.oldIndex;
			var bi = e.newIndex;
			var $lihead = $( '#divpipeline .lihead' );
			if ( $lihead.length ) {
				var pi = $lihead.data( 'index' );
				pipelineOrder( PIP[ pi ].names, ai - 1, bi - 1 );
			} else {
				pipelineOrder( PIP, ai, bi );
			}
			saveConfig( 'pipeline', 'Pipeline', 'Change order ...' );
		}
	} );
}
function plotPipeline() { //***************************************
	var list = [];
	list.push( [ 'device', DEV.capture.device, ...Array( DEV.capture.channels ).keys() ] );
	PIP.forEach( ( p, i ) => {
		if ( p.type === 'Filter' ) {
			list.push( [ p.type, p.channel, p.names ] );
		} else {
			list.push( [ p.type, p.name, ...Array( MIX[ p.name ].channels.in ).keys() ] );
		}
	} );
	list.push( [ 'device', DEV.playback.device, ...Array( DEV.playback.channels ).keys() ] );
	return list
}
function renderDevices() {
	renderDevicesList( 'sampling', L.sampling );
	renderDevicesList( 'capture' );
	renderDevicesList( 'playback' );
	var keys = [];
	if ( DEV.enable_rate_adjust ) keys.push( 'adjust_period', 'target_level' );
	if ( DEV.enable_resampling ) keys.push( 'resampler_type', 'capture_samplerate' );
	keys.length ? renderDevicesList( 'options', keys ) : $( '#divoptions .statuslist' ).empty();
	[ 'enable_rate_adjust', 'enable_resampling', 'stop_on_rate_change' ].forEach( k => {
		$( '#'+ k ).prop( 'checked', DEV[ k ] );
	} );
}
function renderDevicesList( section, keys ) {
	if ( [ 'capture', 'playback' ].includes( section ) ) {
		var kv = jsonClone( DEV[ section ] );
		keys   = deviceKeys( section, kv.type );
	} else {
		var kv = DEV;
	}
	if ( section === 'options' ) {
		var labels = '<hr>';
		var values = '<hr>';
	} else {
		var labels = '';
		var values = '';
	}
	keys.forEach( k => {
		labels += key2label( k ) +'<br>';
		values += kv[ k ] +'<br>';
	} );
	if ( DEV.resampler_type === 'FreeAsync' ) {
		[ 'sinc_len', 'oversampling_ratio', 'interpolation', 'window', 'f_cutoff' ].forEach( k => {
			labels += key2label( k ) +'<br>';
			values += DEV.resampler_type.FreeAsync[ k ] +'<br>';
		} );
	}
	$( '#div'+ section +' .statuslist' ).html(
		 '<div class="col-l text gr">'+ labels +'</div>'
		+'<div class="col-r text">'+ stringReplace( values ) +'</div><div style="clear:both"></div>'
	);
}
function renderPage() {
	DEV = S.config.devices;
	FIL = S.config.filters;
	MIX = S.config.mixers;
	PIP = S.config.pipeline;
	$( '#statusvalue' ).html( S.status );
	$( '#configuration' )
		.html( htmlOption( S.lsconf ) )
		.val( S.fileconf );
	[ 'playback', 'capture' ].forEach( ( k, i ) => {
		S.devicetype[ i ].sort().forEach( t => {
			var v = t.replace( 'Alsa', 'ALSA' )
					 .replace( 'Std',  'std' );
			L.devicetype[ k ][ v ] = t; // [ 'Alsa', 'CoreAudio', 'Pulse', 'Wasapi', 'Jack', 'Stdin/Stdout', 'File' ]
		} );
	} );
	renderTab();
	showContent();
}
function renderTab() {
	var id    = V.currenttab
	var title = key2label( id );
	if ( id === 'pipeline' ) title += ico( 'info-circle' );
	title    += ico( id === 'devices' ? 'gear settings' : 'add' );
	$( '#divsettings .headtitle' ).eq( 0 ).html( title );
	$( '.tab' ).addClass( 'hide' );
	$( '#div'+ id ).removeClass( 'hide' );
	$( '#bar-bottom div' ).removeClass( 'active' );
	$( '#'+ id ).addClass( 'active' );
	if ( id === 'devices' ) {
		renderDevices();
		return
	}
	
	var nextpage = id !== 'filters' && $( '#div'+ id ).find( '.lihead' ).length;
	var kv    = jsonClone( S.config[ id ] );
	if ( $.isEmptyObject( kv ) ) return
	
	if ( $( '#div'+ id ).find( 'svg' ).length ) return //****************************************************
	
	if ( id === 'pipeline' ) {
		var $svg = $( '#divpipeline .ligraph svg' );
		if ( $svg.length ) {
			var svg  = $svg[ 0 ].outerHTML;
			var hide = $svg.parent().hasClass( 'hide' ) ? 'hide' : '';
		} else {
			var svg  = '';
			var hide = 'hide';
		}
		
		var li   = '<li class="ligraph '+ hide +'">'+ svg +'</li>';
		kv.forEach( ( el, i ) => {
			if ( el.type === 'Filter' ) {
				var icon = 'graph'
				var each = '<div class="li1">'+ el.type +'</div>'
						  +'<div class="li2">channel '+ el.channel +': '+ el.names.join( ', ' ) +'</div>';
			} else {
				var icon = 'mixers'
				var each = el.name;
			}
			li += '<li data-type="'+ el.type +'" data-index="'+ i +'">'+ ico( icon ) + ico( 'remove' ) + each +'</li>';
			li += el.type === 'Filter' ? '<li class="ligraph hide"></li>' : '';
		} );
		$( '#div'+ id +' .entries' ).html( li );
		nextpage ? $( '#div'+ id +' li' ).eq( V[ id ] ).trigger( 'click' ) : pipelineSort();
		return
	}
	
	var data = {};
	var keys = Object.keys( kv );
	keys.sort().forEach( k => data[ k ] = kv[ k ] ); // not sort pipeline
	if ( id === 'filters' ) {
		var classvol  = S.mute ? ' infobtn-primary' : '';
		var iconvol   = S.mute ? 'mute' : 'volume';
		var step_val  = ' step="0.1" value="'+ dbFormat( S.volume ) +'"';
		var li = '<li class="liinput main"><a class="mutemain infobtn'+ classvol +'">'+ ico( iconvol ) +'</a><span class="name">Main Gain</span>'
				+'<input type="number"'+ step_val +'>'
				+'<input type="range" class="range"'+ step_val +' min="-55" max="5">'
				+'</li>';
		$.each( data, ( k, v ) => {
			var param = v.parameters;
			var val   = JSON.stringify( param )
							.replace( /[{"}]/g, '' )
							.replace( 'type:', '' )
							.replace( /,/g, ', ' );
			if ( 'gain' in param ) {
				var liinput   =  ' class="liinput"';
				step_val      =  ' step="0.1" value="'+ dbFormat( param.gain ) +'"';
				var licontent =  '<span class="name">'+ k +'</span>'
								+'<input type="number"'+ step_val +'>'
								+'<input type="range"'+ step_val +' min="-6" max="6">'
								+ ico( 'remove' );
			} else {
				var liinput     =  '';
				var licontent =  ico( 'remove' )
								+'<div class="li1">'+ k +'</div>'
								+'<div class="li2">'+ v.type +': '+ val +'</div>';
			}
			li += '<li'+ liinput +' data-name="'+ k +'">'+ ico( 'graph' ) + licontent  +'</li>';
			li += 'gain' in param ? '<li class="ligraph hide"></li>' : '';
		} );
		if ( S.lscoef.length ) {
			li += '<li class="lihead files">Files '+ ico( 'add' ) +'</li>';
			S.lscoef.forEach( k => li += '<li data-name="'+ k +'">'+ ico( 'file' ) + ico( 'remove' ) + k +'</li>' );
		}
	} else if ( id === 'mixers' ) {
		var li = '';
		$.each( data, ( k, v ) => {
			li +=    '<li data-name="'+ k +'">'+ ico( id ) + ico( 'remove' )
					+'<div class="li1">'+ k +'</div>'
					+'<div class="li2">In: '+ v.channels.in +' - Out: '+ v.channels.out +'</div>'
					+'</li>';
		} );
	}
	$( '#div'+ id +' .entries' ).html( li );
	if ( nextpage ) $( '#div'+ id +' li' ).eq( V[ id ] ).trigger( 'click' );
}
function saveConfig( icon, titlle, msg ) {
	var config = JSON.stringify( S.config ).replace( /"/g, '\\"' );
	ws.send( '{ "SetConfigJson": "'+ config +'" }' );
	if ( icon ) notify( icon, titlle, msg, 3000 );
}
function stringReplace( k ) {
	return k
			.replace( 'Alsa',  'ALSA' )
			.replace( 'Std',   'std' )
			.replace( 'FLOAT', 'Float' )
			.replace( 'TEXT',  'Text' )
}
