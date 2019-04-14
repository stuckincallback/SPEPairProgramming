var express = require('express');
var router = express.Router();
var onlineUser= new Map();
var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function(passport, io){

	/* GET login page. */
	router.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('index', { message: req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash : true  
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('register',{message: req.flash('message')});
	});

	/* Handle Registration POST */	
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/home',
		failureRedirect: '/signup',
		failureFlash : true  
	}));

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		res.render('home', { user: req.user });
	});

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	/* Handle Registration POST */	
	router.post('/connectToUser', (req, res)=>{
			console.log('Inside connectToUser '+req.body.friendid);
			io.to(req.body.friendid).emit('challengeReceived',{name:req.body.name})
	});

	io.on('connection', function(socket){
		response={}
		console.log('socket id is '+socket.id);
		socket.on('chat message', function(msg){
		  console.log(msg);
		  response.text = msg.text;
		  response.name = msg.name;
		  io.sockets.emit('chat message', response);
		});
	
		socket.on('userConnected', function(msg){
			if(onlineUser.has(msg.userName)){
	
			}else{
				onlineUser.set(msg.socketid, msg);
			}
			if(onlineUser.size != 0){
				let userArray = []
				onlineUser.forEach( user=>{userArray.push(user)});
				io.sockets.emit('newUserConnected', {userArray});
			}
		});
		socket.on('disconnect', function(){
			console.log('socket disconnected'+socket.id);
			onlineUser.delete(socket.id);
			let userArray = []
			onlineUser.forEach( user=>{userArray.push(user)});
			io.sockets.emit('newUserConnected', {userArray});
		});
	
		socket.on('challengeAccepted', function(msg){
			console.log(msg);
		});
	  });
	return router;
}

