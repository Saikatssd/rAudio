<?php
$time = time();
include 'logosvg.php';
?>
<!DOCTYPE html>
<html>
<head>
	<title>R+R User Guide</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="msapplication-tap-highlight" content="no">
	<link rel="icon" href="/assets/img/icon.<?=$time?>.png">
	<style>
		@font-face {
			font-family: rern; font-display: block; font-style: normal; font-weight: normal;
			src: url( "/assets/fonts/rern.<?=$time?>.woff2" ) format( 'woff2' );
		}
	</style>
	<link rel="stylesheet" href="/assets/css/colors.<?=$time?>.css">
	<link rel="stylesheet" href="/assets/css/common.<?=$time?>.css">
	<link rel="stylesheet" href="/assets/css/settings.<?=$time?>.css">
</head>
<body style="height: 100%">
<div class="head" style="top: 0">
	<i class="page-icon fa fa-question-circle"></i><span class='title'>USER GUIDE</span>
	<a href="/"><i id="close" class="fa fa-times"></i></a>
</div>
<div id="guide">
	<p><a class="gr" href="https://github.com/rern/rAudio-1" target="_blank"><i class="fa fa-github fa-lg bl"></i> Source</a><span id="count" style="float: right"></span></p>
	<div id="library" class="btn btn-default"><i class="fa fa-library"></i><span>Library</span></div>
	<div id="playback" class="btn btn-default active"><i class="fa fa-playback"></i><span>Playback</span></div>
	<div id="playlist" class="btn btn-default"><i class="fa fa-playlist"></i><span>Playlist</span></div>
	<div id="settings" class="btn btn-default"><i id="settings" class="fa fa-gear"></i></div>
	<div class="prev-next"><i id="previous" class="fa fa-arrow-left"></i>&emsp;<i id="next" class="fa fa-arrow-right"></i></div>
	<img src="/assets/img/guide/1.<?=$time?>.jpg">
</div>
<script src="/assets/js/plugin/jquery-3.6.0.min.js"></script>
<script src="/assets/js/plugin/Tocca.min.<?=$time?>.js"></script>
<script>
var nlibrary = 22;
var nplaylist = 39;
var nsettings = 46;
var ntotal = 57;
var n = 1;
$( '#count' ).text( n +' / '+ ntotal );

$( '.btn' ).click( function() {
	var page = {
		  playback : 1
		, library  : nlibrary
		, playlist : nplaylist
		, settings : nsettings
	}
	n = page[ this.id ]
	renderPage( n );
} );
$( '#next' ).click( function() {
	n = n < ntotal ? n + 1 : 1;
	renderPage( n );
} );
$( '#previous' ).click( function() {
	n = n > 1 ? n - 1 : ntotal;
	renderPage( n );
} );
$( 'body' ).on( 'swipeleft', function() {
	$( '#next' ).click();
} ).on( 'swiperight', function() {
	$( '#previous' ).click();
} );
function renderPage( n ) {
	$( 'img' ).attr( 'src', '/assets/img/guide/'+ n +'.<?=$time?>.jpg' );
	$( '#count' ).text( n +' / '+ ntotal );
	$( '.btn' ).removeClass( 'active' );
	if ( n >= 1 && n < nlibrary ) {
		var id = 'playback';
	} else if ( n >= nlibrary && n < nplaylist ) {
		var id = 'library';
	} else if ( n >= nplaylist && n < nsettings ) {
		var id = 'playlist';
	} else {
		var id = 'settings';
	}
	$( '#'+ id ).addClass( 'active' );
}
</script>
</body>
</html>
