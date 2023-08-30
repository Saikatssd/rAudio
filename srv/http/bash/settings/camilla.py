#!/usr/bin/python

import json
import os
import os.path
import sys
from websocket import create_connection

try:
    ws = create_connection( 'ws://127.0.0.1:1234' )
except:
    sys.exit()

def getValue( cmd ):
    ws.send( json.dumps( cmd ) )
    data  = json.loads( ws.recv() )
    return data[ cmd ][ 'value' ]
    
if len( sys.argv ) > 1:
    cmd = sys.argv[ 1 ]
    if cmd == 'save':
        config = getValue( 'GetConfig' )
        file   = getValue( 'GetConfigName' )
        with open( file, 'w' ) as f: f.write( config )
    else:
        target = sys.argv[ 2 ]
        config = json.loads( getValue( 'GetConfigJson' ) )
        if cmd == 'filters':
            from camilladsp_plot import eval_filter
            data = eval_filter( config[ 'filters' ][ target ] )
        elif cmd == 'pipeline':
            from camilladsp_plot import eval_filterstep
            data  = eval_filterstep( config, int( target ) )
        print( json.dumps( data ) )
        
    ws.close()
    sys.exit()

status     = {}
for k in [ 'GetState', 'GetCaptureRate', 'GetBufferLevel', 'GetClippedSamples', 'GetRateAdjust' ]:
    status[ k ] = getValue( k )
    
config     = json.loads( getValue( 'GetConfigJson' ) )
devicetype = getValue( 'GetSupportedDeviceTypes' )
dircamilla = '/srv/http/data/camilladsp/'
value      = {
      'page'       : 'camilla'
    , 'config'     : config
    , 'devicetype' : { 'capture': sorted( devicetype[ 1 ] ), 'playback': sorted( devicetype[ 0 ] ) }
    , 'status'     : status
    , 'configname' : os.path.basename( getValue( 'GetConfigName' ) )
    , 'lscoef'     : sorted( os.listdir( dircamilla +'coeffs' ) )
    , 'lsconf'     : sorted( os.listdir( dircamilla +'configs' ) )
    , 'lsconfbt'   : sorted( os.listdir( dircamilla +'configs-bt' ) )
}
devices    = config[ 'devices' ]
for k in [ 'enable_rate_adjust', 'enable_resampling', 'stop_on_rate_change' ]:
    value[ k ] = devices[ k ]

print( json.dumps( value ) )

ws.close()