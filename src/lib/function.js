var client;
var MessageEmbed;

var queue3s = [];
var queue2s = [];
var queue1s = [];
var lobby = [];
var games = [];

//COSTANTI GENERICHE
const TIME_MSG = 100;
const timer = ms => new Promise( res => setTimeout(res, ms));

//ConfigFile
const cfg = require("../config.js");

//Librerie
const db = require("./db.js");
const preLobby = require("../class/pre-lobby.js");
const clobby = require("../class/pre-lobby.js");

async function setup(c, msg){
  client = c;
  MessageEmbed = msg;

  await db.dbStart();
}

//Funzione printa tutto un array. || DEBUG
async function PrintArray(items) {
    console.log("Lista:");
    items.forEach(function(item) {
      console.log(item);
  });
}

//Funzione per l'Embed dei messaggi.
async function Embed(channel, title, description) {
    const embed = new MessageEmbed()
      .setTitle(title)
      .setColor(0xff0000)
      .setDescription(description)
      .setFooter("Created by Halex_");
    
    //await timer(TIME_MSG);
    await channel.send(embed);
}

//Funzione per errore tramite l'Embed dei messaggi.
async function Error(channel, title, description) {
    const embed = new MessageEmbed()
      .setTitle(title)
      .setColor(0xff0000)
      .setDescription(description);
    await channel.send(embed);
}

//Funzione per l'Embed dei messaggi in DM.
async function EmbedDM(user, title, description) {
    const embed = new MessageEmbed()
      .setTitle(title)
      .setColor(0xff0000)
      .setDescription(description);
    await user.send(embed);
}

//Funzione per errore tramite l'Embed dei messaggi in DM.
async function ErrorDM(user, title, description) {
    const embed = new MessageEmbed()
      .setTitle(title)
      .setColor(0xff0000)
      .setDescription(description);
    await user.send(embed);
}

//Funzione per aggiungere il tag ai player
async function TagPlayer(queue){
  var str = "";
  
  for(var i = 0; i < queue.length ; i++){
    if(i < queue.length-1)
      str += "<@" + queue[i].id + ">, ";
    else
      str += "<@" + queue[i].id + ">";
  }

  return str;
}

//Funzione per mandare un messaggio normale.
async function SendMSG(channel, txt){
  await channel.send(txt);
}

//Funzione per mandare un messaggio normale.
async function SendDM(user, title, txt){
  await EmbedDM(user, title , txt);
}

//Funzione per ottenere id della lobby in cui c'è l'user
async function getIdLobby(user){
  var i = 0;
  var trov = -1;

  while(i < lobby.length && trov < 0){

    if(await lobby[i].hasPlayer(user.id)){
      trov = i;
    }
    i++;
  }

  return trov;
}

//Funzione per verificare se un utente è in un altra lobby.
async function isLobby(user){
  var i = 0;
  var trov = false;

  while(i < lobby.length && !trov){
    if(await lobby[i].hasPlayer(user.id)){
      trov = true;
    }
    i++;
  }

  return trov;
}

//Funzione per verificare se un utente è in un altra lobby.
async function isCap(user){
  var id = await getIdLobby(user);
  if(id === -1) return;

  return await lobby[id].isCap(user.id);
}

//Aggiorna o inserisce l'utente nel db
//Restituisce true se lo inserisce, false se da errore.
async function setUser(data, table){
  try {
    await db.setUser(table, data);
    return true;
  }
  catch (e) {
    return false;
  }
}

//Crea i dati per l'utente e li inserisce nel db
//Restituisce true se lo inserisce, false se da errore.
async function createUser(user, guild, modality){
  data = {
    id: `${guild.id}-${user.id}`,
    user: user.id,
    guild: guild.id,
    tag: user.tag,
    win: 0,
    lose: 0,
    points: 0
  }

  return setUser(data, modality);
}

async function randomTeam(l){

  var vote = await l.getVote("r");
  var max = await l.getSizeQueue();

  if(vote >= max/2){
    await l.setNoVotable();
    var players = await l.getPlayers();
    var i = 0;

    while(players.length > 0){
      var rand = await Math.round(await Math.random() * ((players.length-1) - 0)) + 0;

      if(i % 2 === 0)
        await l.addTeam1(players[rand]);
      else
        await l.addTeam2(players[rand]);
      
      i++;
    }

    await Embed(await l.getChannel(), "Lobby" , await l.teamToString());
    await createLobby(l);
  }
}

async function resetArray(queue){
  while(queue.length > 0){
    await queue.splice(0, 1);
  }
}

async function isQueue(queue, user){
  var i = 0;
  var trov = false;

  while(i < queue.length && !trov){
    if(queue[i].id === user.id){
      trov = true;
    }
    i++;
  }

  return trov;
}

async function getDate(){
  let date_ob = new Date();
  // current date
  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2);

  // current month
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  // current year
  let year = date_ob.getFullYear();

  // current hours
  let hours = date_ob.getHours();

  // current minutes
  let minutes = date_ob.getMinutes();

  // current seconds
  let seconds = date_ob.getSeconds();

  // prints date in YYYY-MM-DD format
  console.log(year + "-" + month + "-" + date);

  // prints date & time in YYYY-MM-DD HH:MM:SS format
  str = date + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds;

  return str;
}

//Crea i dati per l'utente e li inserisce nel db
//Restituisce true se lo inserisce, false se da errore.
async function createLobby(l){

  data = {
    id: await db.count("lobby"),
    team1: await l.getTeam1().toString(),
    team2: await l.getTeam2().toString(),
    date: await getDate(),
    win: ""
  }
  
  await db.setLobby(data);
}


async function Update(old, newuser){//Update user if change paramater
  console.log(old);
  console.log(newuser);
}

async function Body(msg) {
  //Non prendo in considerazione i bot
  if (msg.author.bot) return;

  const channel = msg.channel; //Variabile per il channel dove è stato scritto il messaggio
  const user = msg.author; //Variabile dell'user che ha scritto il messaggio
  const guild = msg.guild; //Variabile del server

  if(guild){//Sono dentro un server

    //Non prendo in considerazione i comandi senza prefisso
    if (!msg.content.startsWith(cfg.prefix)) return;

    const commandBody = msg.content.slice(cfg.prefix.length); //Prendo il testo senza il prefix
    const args = commandBody.split(' '); //splitto il comando e tutti gli argomenti (se ci sono)
    const command = args.shift().toLowerCase(); //prendo solo il comando

    var queue = queue3s;

    if (command === 'ping') {
      await channel.send('pong');
    }
    else if(command === 'q'){

      if(await isLobby(user) ){ //|| await isQueue(queue, user)
        await Error(channel,"Errore" , "Sei in coda o hai già una lobby in corso, non puoi entrare in coda");
        return;
      } 

      data = await db.getUser("rl-3s", user.id, guild.id); //Prendo l'utente

      if(!data){ //Se l'utente non è presente nel db, creo la variabile e lo aggiungo
        if(!(await createUser(user, guild, "rl-3s"))){
          await Error(channel,"DB" , "Errore nell'inserimento dell'utente");
          return;
        }
      }

      await queue.push(user);

      if(queue.length === 6){ //OCCHIO ALLO STOP MSG

        await lobby.push(new preLobby(queue, channel));
        var str = "6 Persone sono entrare nella queue e verrà creata la lobby.\n" +
        "**Players:** " + await TagPlayer(queue) + "\n" +
        "Scegliere la modalità della lobby, Capitani (,c) o Random (,r)";

        await resetArray(queue);
        await Embed(channel, "Lobby", str);
      }
      else{
        await Embed(channel,"Lista" , queue.length + ' giocatori nella lista!');
      }
    }
    else if(command === 'l' && await isQueue(queue, user)){
      await queue.pop(user.id);
      await Embed(channel,"Lista" , queue.length + ' giocatori nella lista!');
    }
    else if(command === 'c'){
      
      var r = await getIdLobby(user);

      if(r < 0){
        await Error(channel,"Errore" , "Non sei in nessuna lobby");
        return;
      }

      var l = lobby[r];

      if(await l.isVotable())
        return;

      await l.addVote(user, "c");

      var vote = await l.getVote("c");
      var max = await l.getSizeQueue();

      if(vote > max/2){
      
        await l.setNoVotable();

        var players = await l.returnPlayers();
        var row = await db.getScoreLobby("rl-3s", guild, players);
        var cap1 = await l.getPlayer(row[0].user);
        var cap2 = await l.getPlayer(row[1].user);

        await l.setCap(cap1, cap2);
        await SendDM(cap1, "Scegli un player", "Scrivi il numero del player che vuoi in squadra:\n" + await l.choosePlayer());
      }
      else if(vote === max/2){
        await randomTeam(l);
      }
    }
    else if(command === 'r'){
      var r = await getIdLobby(user);

      if(r < 0){
        await Error(channel,"Errore" , "Non sei in nessuna lobby");
        return;
      }

      var l = lobby[r];

      if(await l.isVotable())
        return;

      await l.addVote(user, "r");

      await randomTeam(l);
    }
    else if(command === 'test'){

      console.log("----------QUEUE-------------");
      console.log(queue);

      console.log("----------Lobby-------------");
      console.log(lobby);
      console.log("j: " + await getIdLobby(user));

      var j = await getIdLobby(user);

      if(j === -1)
        return;

      var l = lobby[j];
      var id = parseInt(command);

      console.log("----------INFO-------------");
      console.log("Turno: " + await l.myTurn(user.id));
      console.log("ID: " + id);
      console.log("First capitan: " + await l.firstCap(user.id));

      console.log("----------L-------------"); 
      console.log(l);
      console.log("----------SIZE-------------");
      console.log(await l.getSizeQueue());
      
    }
  }
  else if(await isCap(user)){ //Sono nei DM e sono capitano
    
    const args = msg.content.split(' '); //splitto il comando e tutti gli argomenti (se ci sono)
    const command = args.shift().toLowerCase(); //prendo solo il comando

    var j = await getIdLobby(user);
    var l = lobby[j];
    var id = await parseInt(command);

    //Se l'id non è valido, esco
    if (!id)
      return;
    
    id--;

    //Controllo se è il mio turno
    if(!(await l.myTurn(user.id)))
      return;

    await l.chooseMember(user, await l.getPlayerByIndex(id));

    if(await l.getSizeQueue() === 0){
      await Embed(await l.getChannel(), "Lobby" , await l.teamToString());
      await createLobby(l);
      return;
    }
    else if(await l.firstCap(user.id)){
      await SendDM(await l.getCap2(), "Scegli un player", "Scrivi il numero del player che vuoi in squadra:\n" + await l.choosePlayer());
    }
    else{
      await SendDM(await l.getCap1(), "Scegli un player", "Scrivi il numero del player che vuoi in squadra:\n" + await l.choosePlayer());
    }
  }
  //msg.delete();
}

module.exports = { Body, setup, Update};