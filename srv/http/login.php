<style>
#divlogin {
	transform      : translateY( calc( 50vh - 100% ) );
	text-align     : center;
}
#divlogin svg {
	width          : 50px;
}
#logintitle {
	margin         : 10px 0 10px 20px;
	font-weight    : 300;
	letter-spacing : 25px;
}
#pwd {
	width          : 230px;
	margin         : 30px 10px 10px 25px;
	text-align     : center;
}
#toggle {
	font-size      : 20px;
	vertical-align : -3px;
}
</style>

<div id="infoOverlay" class="hide">
	<div id="infoBox">
		<div id="infoTopBg"><div id="infoTop"><i class="i-lock"></i><a id="infoTitle">Login</a></div></div>
		<div id="infoContent"><div class="infomessage">Wrong password.</div></div>
		<div id="infoOk" class="infobtn infobtn-primary">OK</div>
	</div>
</div>

<div id="divlogin">
	<?=$logosvg?>
	<div id="logintitle">rAudio</div>
	<input type="password" id="pwd"><i id="toggle" class="i-eye"></i>
	<br><a id="login" class="infobtn infobtn-primary">Login</a>
</div>

<script>
var E = {};
[ 'infoOk', 'infoOverlay', 'login', 'pwd', 'toggle' ].forEach( ( el ) => E[ el ] = document.getElementById( el ) );

E.pwd.focus();
document.body.addEventListener( 'keyup', ( e ) => {
	if ( e.key === 'Enter' ) E.infoOverlay.classList.contains( 'hide' ) ? E.login.click() : E.infoOk.click();
} );
E.toggle.addEventListener( 'click', () => {
	if ( E.pwd.type === 'text' ) {
		E.pwd.type = 'password';
		E.toggle.classList.remove( 'bl' );
	} else {
		E.pwd.type = 'text';
		E.toggle.classList.add( 'bl' );
	}
} );
E.login.addEventListener( 'click', () => {
	if ( ! E.pwd.value ) return
	
	var formdata = new FormData();
	formdata.append( 'cmd',      'login' );
	formdata.append( 'password', pwd.value );
	fetch( 'cmd.php', { method: 'POST', body: formdata } )
		.then( ( response ) => response.text() ) // set response data as text > verified
		.then( ( verified ) => {
			if ( verified != -1 ) {
				location.reload();
			} else {
				E.infoOverlay.classList.remove( 'hide' );
				E.pwd.style[ 'caret-color' ] = 'transparent'; // fix: hide blinking cursor on focus
			}
		} );
} );
E.infoOk.addEventListener( 'click', () => {
	E.infoOverlay.classList.add( 'hide' );
	E.pwd.style[ 'caret-color' ] = '';
} );
</script>

</body>
</html>
