//Discord libreria
const Discord = require("discord.js")

//Librerie 
const fun = require("./src/lib/function.js");

// Extract the required classes from the discord.js module
const { Client, MessageEmbed } = require('discord.js');

// Create an instance of a Discord client
const client = new Client();

//Funzione per quando il bot va in run
async function Ready() {
  try{
    console.log("-------------RL Arrows v1.0---------------");
    await fun.setup(client, MessageEmbed);
    console.log(`Logged in as ${client.user.tag}!`);
    console.log("-----------------------------------------");
  }
  catch(e){
    console.log(`Error: ` + e);
  }
}

//------------------------------------ PARTE DISCORD----------------------------

client.on("ready", () => Ready());

client.on("error", (e) => {
console.error(e);
});

client.on("warn", (e) => {
console.warn(e);
});

/*client.on("debug", (e) => {
console.info(e);
});*/

process.on('unhandledRejection', (reason, promise) => {
console.log('Unhandled Rejection at:', reason.stack || reason)
return;
});

client.on("message", msg => fun.Body(msg));
client.on("userUpdate", (user, usernew) => fun.Update(user, usernew));
client.login(process.env.TOKEN);

//------------------------------------ PARTE SERVER WEB ----------------------------

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var rl3s = require('./web/routes/3s');
var app = express();

// view engine setup
app.use('/', rl3s);
app.set('views', path.join(__dirname, 'web/views'));
app.use(express.static(path.join(__dirname, 'web/file')));
app.set('view engine', 'ejs');


app.get('/', (req, res)=>{
  res.render('index');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(3000);