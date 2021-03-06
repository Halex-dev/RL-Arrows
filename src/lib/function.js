var client;
var MessageEmbed;

var queue3s = [];
var queue2s = [];
var queue1s = [];
var lobby = [];
var games = [];

//COSTANTI GENERICHE
const TIME_MSG = 100;
const timer = ms => new Promise(res => setTimeout(res, ms));

//ConfigFile
var cfg = require("../config.json");

//Librerie
const db = require("./db.js");
const preLobby = require("../class/pre-lobby.js");
const fs = require("fs");
const path = require('path');

async function setup(c, msg) {
  try {
    client = c;
    MessageEmbed = msg;

    await getLobby();
    await readJSON();
    await db.dbStart();
  }
  catch (e) {
    await log(e);
  }
}

async function readJSON() {
  cfg = require("../config.json");

  console.log("File config ready");
}

async function saveJSON(data) {

  try {
    fs.writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify(data))
  } catch (err) {
    console.error(err)
  }
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
async function TagPlayer(queue) {
  var str = "";

  for (var i = 0; i < queue.length; i++) {
    if (i < queue.length - 1)
      str += "<@" + queue[i].id + ">, ";
    else
      str += "<@" + queue[i].id + ">";
  }

  return str;
}

//Funzione per mandare un messaggio normale.
async function SendMSG(channel, txt) {
  await channel.send(txt);
}

//Funzione per mandare un messaggio normale.
async function SendDM(user, title, txt) {
  await EmbedDM(user, title, txt);
}

//Funzione per ottenere id della lobby in cui c'?? l'user
async function getIdLobby(user) {
  var i = 0;
  var trov = -1;

  while (i < lobby.length && trov < 0) {

    if (await lobby[i].hasPlayer(user.id)) {
      trov = i;
    }
    i++;
  }

  return trov;
}

//Funzione per verificare se un utente ?? in un altra lobby.
async function isLobby(user) {
  var i = 0;
  var trov = false;

  while (i < lobby.length && !trov) {
    if (await lobby[i].hasPlayer(user.id)) {
      trov = true;
    }
    i++;
  }

  return trov;
}

async function isGames(user) {
  var i = 0;
  var trov = false;

  while (i < games.length && !trov) {
    if (games[i].id === user.id) {
      trov = true;
    }
    i++;
  }

  return trov;
}

async function isQueue(queue, user) {
  var i = 0;
  var trov = false;

  while (i < queue.length && !trov) {
    if (queue[i].id === user.id) {
      trov = true;
    }
    i++;
  }

  return trov;
}

async function idLobby() {
  return queue1s.length + queue2s.length + queue3s.length + lobby.length + games.length + 1;
}

//Funzione per verificare se un utente ?? in un altra lobby.
async function isCap(user) {
  var id = await getIdLobby(user);
  if (id === -1) return;

  return await lobby[id].isCap(user.id);
}

//Aggiorna o inserisce l'utente nel db
//Restituisce true se lo inserisce, false se da errore.
async function setUser(data, table) {
  try {
    await db.setUser(table, data);
    return true;
  }
  catch (e) {
    await log(e);
    return false;
  }
}

//Aggiorna o inserisce l'utente nel db
//Restituisce true se lo inserisce, false se da errore.
async function log(e) {
  await console.log(e);
}

//Aggiorna o inserisce l'utente nel db
//Restituisce true se lo inserisce, false se da errore.
async function setGlobalUser(data) {
  try {
    await db.setGlobalUser(data);
    return true;
  }
  catch (e) {
    await log(e);
    return false;
  }
}


//Crea i dati per l'utente e li inserisce nel db
//Restituisce true se lo inserisce, false se da errore.
async function createUserModality(user, guild, modality) {
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

async function createUser(user) {
  data = {
    id: `${user.id}`,
    tag: user.tag
  }

  return setGlobalUser(data);
}

async function randomTeam(l) {

  var vote = await l.getVote("r");
  var max = await l.getSizeQueue();

  if (vote >= max / 2) {
    await l.setNoVotable();
    var players = await l.getPlayers();
    var i = 0;

    while (players.length > 0) {
      var rand = await Math.round(await Math.random() * ((players.length - 1) - 0)) + 0;

      if (i % 2 === 0)
        await l.addTeam1(players[rand]);
      else
        await l.addTeam2(players[rand]);

      i++;
    }

    await Embed(await l.getChannel(), "Lobby", await l.teamToString());
    await createLobby(l);
  }
}

async function lobby1s(l) {

  await l.setNoVotable();
  var players = await l.getPlayers();
  var i = 0;

  while (players.length > 0) {
      var rand = await Math.round(await Math.random() * ((players.length - 1) - 0)) + 0;

      if (i % 2 === 0)
        await l.addTeam1(players[rand]);
      else
        await l.addTeam2(players[rand]);

      i++;
   }

  await Embed(await l.getChannel(), "Lobby", await l.teamToString());
  await createLobby(l);
}

async function resetArray(queue) {
  while (queue.length > 0) {
    await queue.splice(0, 1);
  }
}

async function getDate() {
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

  // prints date & time in YYYY-MM-DD HH:MM:SS format
  str = date + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds;

  return str;
}

//Inserisce la lobby nel db
async function createLobby(l) {
  var tmp = await db.count("lobby");

  data = {//DA FARE CHE METTE SOLO I NOMI SUL GETTEAM, CREARE FUNZIONE
    id: tmp.num,
    team1: await l.getTeam1ToString(),
    team2: await l.getTeam2ToString(),
    date: await getDate(),
    reported: "",
    score: ""
  }

  await removeLobby(l);
  await db.setLobby(data);

  data.team1 = data.team1.split(',');
  data.team2 = data.team2.split(',');
  games.push(data);
}

//Inserisce la lobby nel db
async function removeLobby(l) {

  var i = 0;
  var trov = -1;

  while (i < lobby.length && trov < 0) {
    if (await l.returnID() === await lobby[i].returnID()) {
      trov = i;
      lobby.splice(i, 1);
    }
    i++;
  }
}

//Ottiene le lobby ancora da reportare
async function getLobby() {
  var rows = await db.getLobbyReport();

  for (var i = 0; i < rows.length; i++) {

    var tmp1 = rows[i].team1.split(',');
    var tmp2 = rows[i].team2.split(',');
    data = {
      id: await parseInt(rows[i].id),
      team1: tmp1,
      team2: tmp2,
      date: rows[i].date,
      reported: rows[i].reported,
      score: ""
    }
    games.push(data);
  }

  if (rows.length === undefined)
    console.log("Recovery 0 games to reported!");
  else
    console.log("Recovery " + rows.length + " games to reported!");
}

//Ottiene le lobby ancora da reportare
async function getIDLobbyReport(id) {

  var i = 0;
  var trov = -1;

  while (i < games.length && trov < 0) {
    if (id === games[i].id) {
      trov = i;
    }
    i++;
  }

  return trov;
}

async function isAdmin(member){
  if(!member.hasPermission('ADMINISTRATOR'))
    return false;
  else
    return true;
}

//Funzione per ottenere l'index dell'utente
async function getIndexUser(userid, queue) {
  var i = 0;
  var trov = -1;

  while (i < queue.length && trov < 0) {
    if (queue[i].id === userid) {
      trov = i;
    }
    i++;
  }

  return trov;
}

async function cleanUser(userid, modality){

  if(modality === "rl-3s"){
    var id1 = await getIndexUser(userid, queue1s);
    var id2 = await getIndexUser(userid, queue2s);

    if(id1 >= 0)
      queue1s.splice(id1, 1);

    if(id2 >= 0)
      queue2s.splice(id2, 1);
  }
  else if(modality === "rl-2s"){
    var id1 = await getIndexUser(userid, queue1s);
    var id2 = await getIndexUser(userid, queue3s);

    if(id1 >= 0)
      queue1s.splice(id1, 1);
    
    if(id2 >= 0)
      queue3s.splice(id2, 1);
  }
  else if(modality === "rl-1s"){
    var id1 = await getIndexUser(userid, queue3s);
    var id2 = await getIndexUser(userid, queue2s);

    if(id1 >= 0)
      queue3s.splice(id1, 1);

    if(id2 >= 0)
      queue2s.splice(id2, 1);
  }
  
}

async function togglePeople(queue, modality){
  var tmp = queue;
  for (var i = 0; i < tmp.length; i++) {
    await cleanUser(tmp[i].id, modality);
  }
}

async function Update(old, newuser) {//Update user if change paramater

  data = db.getGlobalUser(old.id);

  data.tag = newuser.tag;

  db.setGlobalUser(data);
}


async function Body(msg) {
  //Non prendo in considerazione i bot
  if (msg.author.bot) return;

  const channel = msg.channel; //Variabile per il channel dove ?? stato scritto il messaggio
  const user = msg.author; //Variabile dell'user che ha scritto il messaggio
  const guild = msg.guild; //Variabile del server

  if (guild) {//Sono dentro un server

    //Non prendo in considerazione i comandi senza prefisso
    if (!msg.content.startsWith(cfg.prefix)) return;

    const commandBody = msg.content.slice(cfg.prefix.length); //Prendo il testo senza il prefix
    const args = commandBody.split(' '); //splitto il comando e tutti gli argomenti (se ci sono)
    const command = args.shift().toLowerCase(); //prendo solo il comando


    if (await isAdmin(msg.member)) {
      if (command === 'channel') {

        var txt = args[0];

        if(txt === undefined){
          await Error(channel, "Errore", "Syntx error: "+ cfg.prefix +"channel (1s,2s,3s)");
          return;
        }

        if(txt === "3s"){
          cfg.ch3s = msg.channel.id;
        }
        else if(txt === "2s"){
          cfg.ch2s = msg.channel.id;
        }
        else if(txt === "1s"){
          cfg.ch1s = msg.channel.id;
        }
        
        await saveJSON(cfg);
      }
      else if(command === 'setscore'){
        var txt = args[0];
        var score = args[1];

        if(txt === undefined || score === undefined){
          await Error(channel, "Errore", "Syntx error: "+ cfg.prefix +"setscore (2-0, 0-2, 2-1 , 1-2) score");
          return;
        }

        if(txt === "2-0"){
          cfg.winEz = score;
        }
        else if(txt === "0-2"){
          cfg.loseEz = score;
        }
        else if(txt === "2-1"){
          cfg.win = score;
        }
        else if(txt === "1-2"){
          cfg.lose = score;
        }
        else{
          await Error(channel, "Errore", "Syntx error: "+ cfg.prefix +"setscore (2-0, 0-2, 2-1 , 1-2) score");
          return;
        }

        await saveJSON(cfg);
      }
      else if(command === 'prefix'){
        var txt = args[0];

        if(txt === undefined){
          await Error(channel, "Errore", "Syntx error: "+ cfg.prefix +"prefix [prefisso] ");
          return;
        }

        cfg.prefix = txt;

        await saveJSON(cfg);
      }
      else if(command === 'clear'){

        if(msg.channel.id === cfg.ch3s){
          queue = queue3s;
        }
        else if(msg.channel.id === cfg.ch2s){
          queue = queue2s;
        }
        else if(msg.channel.id === cfg.ch1s){
          queue = queue1s;
        }
        else{
          await Error(channel, "Errore", "Non sei in nessuno");
          return;
        }

        queue = [];
        await SendDM(channel, "Comando eseguito", "Queue clearata");
      }
      else if(command === 'help'){

        channel.send("```Comandi admin: \n" +
        "-channel: settare i channel delle partite\n"+
        "-setscore: settare i punteggi delle partite\n"+
        "-prefix: cambiare prefisso al bot\n"+
        "-clear: pulire la queue su una determinata modalit??\n ```");
      }
    }
    
    var queue = null;
    var maxQueue = 0;
    var modality = null;

    if(msg.channel.id === cfg.ch3s){
      queue = queue3s;
      maxQueue = 6;
      modality = "rl-3s";
    }
    else if(msg.channel.id === cfg.ch2s){
      queue = queue2s;
      maxQueue = 4;
      modality = "rl-2s";
    }
    else if(msg.channel.id === cfg.ch1s){
      queue = queue1s;
      maxQueue = 2;
      modality = "rl-1s";
    }

    if(queue === null || maxQueue === 0 || modality === null)
      return;

    //Comandi utenti normali
    if (command === 'q') {
      if (await isLobby(user) && await isGames(user)) { //|| await isQueue(queue, user)
        await Error(channel, "Errore", "Sei in coda o hai gi?? una lobby in corso, non puoi entrare in coda");
        return;
      }

      data = await db.getGlobalUser(user.id); //Prendo l'utente

      if (!data) { //Se l'utente non ?? presente nel db, creo la variabile e lo aggiungo
        if (!(await createUser(user))) {
          await Error(channel, "DB", "Errore nell'inserimento dell'utente");
          return;
        }
      }

      data = await db.getUser(modality, user.id, guild.id); //Prendo l'utente

      if (!data) { //Se l'utente non ?? presente nella modalit?? desiderata, lo aggiungo
        if (!(await createUserModality(user, guild, modality))) {
          await Error(channel, "DB", "Errore nell'inserimento dell'utente");
          return;
        }
      }

      queue.push(user);

      if(maxQueue === 2 && queue.length === maxQueue){
        var l = new preLobby(await idLobby(), queue, channel);
        await lobby1s(l);
        await togglePeople(queue, modality);
        await resetArray(queue);
      }
      else if (queue.length === maxQueue) {

        lobby.push(new preLobby(await idLobby(), queue, channel));
        var str = "6 Persone sono entrare nella queue e verr?? creata la lobby.\n" +
          "**Players:** " + await TagPlayer(queue) + "\n" +
          "Scegliere la modalit?? della lobby, Capitani (,c) o Random (,r)";

        Embed(channel, "Lobby", str);
        togglePeople(queue, modality);
        resetArray(queue);
      }
      else {
        await Embed(channel, "Lista", queue.length + ' giocatori nella lista!');
      }
    }
    else if (command === 'l' && await isQueue(queue, user)) {
      var id = await getIndexUser(user.id, queue);

      if(id >= 0)
        queue.splice(id, 1);

      await Embed(channel, "Lista", queue.length + ' giocatori nella lista!');
    }
    else if (command === 'c') {

      var r = await getIdLobby(user);

      if (r < 0) {
        await Error(channel, "Errore", "Non sei in nessuna lobby");
        return;
      }

      var l = lobby[r];

      if (await l.isVotable())
        return;

      await l.addVote(user, "c");

      var vote = await l.getVote("c");
      var max = await l.getSizeQueue();

      if (vote > max / 2) {

        await l.setNoVotable();

        var players = await l.returnPlayers();
        var row = await db.getScoreLobby(modality, guild, players);
        var cap1 = await l.getPlayer(row[0].user); //ID
        var cap2 = await l.getPlayer(row[1].user);

        await l.setCap(cap1, cap2);
        await SendDM(cap1, "Scegli un player", "Scrivi il numero del player che vuoi in squadra:\n" + await l.choosePlayer());
      }
      else if (vote === max / 2) {
        await randomTeam(l);
      }
    }
    else if (command === 'r') {
      var r = await getIdLobby(user);

      if (r < 0) {
        await Error(channel, "Errore", "Non sei in nessuna lobby");
        return;
      }

      var l = lobby[r];

      if (await l.isVotable())
        return;

      await l.addVote(user, "r");

      await randomTeam(l);
    }
    else if (command === 'report') {
      var index = await parseInt(args[0]);
      var report = args[1];
      var pointW = 0;
      var pointL = 0;

      if (isNaN(index) || index < 0) {
        await Error(channel, "Errore", "ID lobby non valido (ES: ,report idlobby risultato)");
        return;
      }

      id = await getIDLobbyReport(index);

      if (id < 0) {
        await Error(channel, "Errore", "ID sbagliato il game non esiste");
        return;
      }

      var where = "";
      
      if(await games[id].team1.includes(user.id)){
        where = "team1";
      }
      else if(await games[id].team2.includes(user.id)){
        where = "team2";
      }
      
      if (where !== "team2" && where !== "team1") {
        await Error(channel, "Errore", "Non puoi reportare un game a cui non partecipi");
        return;
      }

      var win = null;

      if(report === "2-0"){
        pointW = cfg.winEz;
        pointL = cfg.loseEz;
        win = true;
      }
      else if(report === "0-2"){
        pointW = cfg.winEz;
        pointL = cfg.loseEz;
        win = false;
      }
      else if(report === "2-1"){
        pointW = cfg.win;
        pointL = cfg.lose;
        win = true;
      }
      else if(report === "1-2"){
        pointW = cfg.win;
        pointL = cfg.lose;
        win = false;
      }
      else{
        await Error(channel, "Errore", "Il testo del report deve essere il risultato, es: 2-1");
        return;
      }

      try {
        games[id].reported = user.id;
        games[id].win = report;

        var team1 = games[id].team1;
        var team2 = games[id].team1;

        data = {
          id: games[id].id,
          team1: games[id].team1.toString(),
          team2: games[id].team2.toString(),
          date: games[id].date,
          reported: user.id,
          score: report
        }

        var team1 = games[id].team1;
        var team2 = games[id].team2;

        console.log(win);
        console.log(where);

        if(win){
          if(where === "team1"){
            console.log(team1);
            for (var i = 0; i < team1.length; i++) {
              await db.setWin(modality, team1[i], guild.id, pointW);
            }

            for (var i = 0; i < team2.length; i++) {
              await db.setLose(modality, team2[i], guild.id, pointL);
            }
          }
          else{
            for (var i = 0; i < team1.length; i++) {
              await db.setLose(modality, team1[i], guild.id, pointL);
            }

            for (var i = 0; i < team2.length; i++) {
              await db.setWin(modality, team2[i], guild.id, pointW);
            }
          }
        }
        else{
          if(where === "team1"){
            for (var i = 0; i < team1.length; i++) {
              await db.setLose(modality, team1[i], guild.id, pointL);
            }

            for (var i = 0; i < team2.length; i++) {
              await db.setWin(modality, team2[i], guild.id, pointW);
            }
          }
          else{
            for (var i = 0; i < team1.length; i++) {
              await db.setWin(modality, team1[i], guild.id, pointW);
            }

            for (var i = 0; i < team2.length; i++) {
              await db.setLose(modality, team2[i], guild.id, pointL);
            }
          }
        }

        await db.setLobby(data);
      }
      catch (e) {
        await log(e);
        return;
      }
      
      games.splice(id, 1);
    }
    else if (command === 'f') {
      console.log("f");
    }
    else if (command === 'test') {

      console.log(games);
    }
  }
  else if (await isCap(user)) { //Sono nei DM e sono capitano

    const args = msg.content.split(' '); //splitto il comando e tutti gli argomenti (se ci sono)
    const command = args.shift().toLowerCase(); //prendo solo il comando

    var j = await getIdLobby(user);
    var l = lobby[j];
    var id = await parseInt(command);

    //Se l'id non ?? valido, esco
    if (!id)
      return;

    id--;

    //Controllo se ?? il mio turno
    if (!(await l.myTurn(user.id)))
      return;

    if (id > (await l.getSizeQueue() - 1))
      return;

    await l.chooseMember(user, await l.getPlayerByIndex(id));

    if (await l.getSizeQueue() === 0) {
      await Embed(await l.getChannel(), "Lobby", await l.teamToString());
      await createLobby(l);
      return;
    }
    else if (await l.firstCap(user.id)) {
      await SendDM(await l.getCap2(), "Scegli un player", "Scrivi il numero del player che vuoi in squadra:\n" + await l.choosePlayer());
    }
    else {
      await SendDM(await l.getCap1(), "Scegli un player", "Scrivi il numero del player che vuoi in squadra:\n" + await l.choosePlayer());
    }
  }
  //msg.delete();
}

module.exports = { Body, setup, Update };