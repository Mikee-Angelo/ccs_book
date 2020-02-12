#!/usr/bin/env php
<?php 
include "lib/phpsockets.io.php";

	
/**
* The port to run this socket on
*/ 
$server_port="2000";

//initialize socket service
$socket=new PHPWebSockets("0.0.0.0",$server_port);

$socket->on('chat message', function($socket, $data, $sender){
	$socket->broadcast('chat message', $data, true);
})