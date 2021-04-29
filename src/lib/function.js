var client;
var MessageEmbed;

var queue3s = [];
var queue2s = [];
var queue1s = [];
var lobby = [];


//ConfigFile
const cfg = require("../config.js");

//Librerie
const db = require("./db.js");
const preLobby = require("../class/pre-lobby.js");

/*  TO DO LIST SIX ARROWS
- .c: I capitani sono le 2 persone più alte in classifica.
- .r: team completamente randomici
- report partita
- try e catch
- Velocizzare algoritmi per la creazione della lobby al 6 player
- cambiare i change dell'user
- Cancella l'utente dalle altre queue quando crea una lobby
- fix SQL injection
- CONFIG con json
- canali personalizzati
- Integrazione API RL (?)
- refresh del nome se lo cambia
- Nella votazione per scegliere bisogna avere una maggioranza tra le 2 modalità, quindi avere almeno 4 voti per .c o 4 voti per .r || In caso di parità, si darà la priorità al .c 
- Backup db

- Mettere che i comandi funzionano solo nelle chat apposite. 
- Lo staff + helper possono modificare i punti delle varie modalità e modificare alcuni problemi del bot.
*PUNTEGGI*
  In caso una squadra vinca  2-0 si vincono 5 punti
  In caso una squadra perda 2-0 si perdono 4 punti
  In caso una squadra vinca 2-1 si vincono 3 punti
  In caso una squadra perda 2-1 si perdono  2 punti
*/

function setup(c, msg){
  client = c;
  MessageEmbed = msg;

  db.dbStart();
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


async function Update(user){//Update user if change paramater
  console.log(user);
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

  return new Promise(function(resolve, reject) {
    resolve(str);
  });
}

//Funzione per mandare un messaggio normale.
async function SendMSG(channel, txt){
  channel.send(txt);
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
  return new Promise(function(resolve, reject) {
    resolve(trov);
  });
}

//Funzione per verificare se un utente è in un altra lobby.
async function isLobby(user){
  var i = 0;
  var trov = 0;

  while(i < lobby.length && trov == 0){

    if(await lobby[i].hasPlayer(user.id)){
      trov = 1;
    }
    i++;
  }
  return new Promise(function(resolve, reject) {
    resolve(trov == 1);
  });
}

//Funzione per verificare se un utente è in un altra lobby.
async function isCap(user){
  var id = await getIdLobby(user);
  if(id === -1) return;

  var res = await lobby[id].isCap(user.id);
  
  return new Promise(function(resolve, reject) {
    resolve(res);
  });
}

//Aggiorna o inserisce l'utente nel db
//Restituisce true se lo inserisce, false se da errore.
async function setUser(data, table){
  return new Promise(function(resolve, reject) {
    try {
      db.setUser(table, data);
      resolve(true);
    }
    catch (e) {
      console.log(e);
      reject(false);
    }
  });
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
  return new Promise(function(resolve, reject) {
    resolve(setUser(data, modality));
  });
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

    if (command === 'ping') {
      await channel.send('pong');
    }
    else if(command === 'q' ){//&& !queue.includes(user.id)

      var queue = queue3s;
      var result = await isLobby(user);

      if(result){
        Error(channel,"Errore" , "Sei già in un altra lobby, non puoi entrare in coda");
        return;
      } 

      data = db.getUser("rl-3s", user.id, guild.id); //Prendo l'utente

      if(!data){ //Se l'utente non è presente nel db, creo la variabile e lo aggiungo
        if(!(await createUser(user, guild, "rl-3s"))){
          await Error(channel,"DB" , "Errore nell'inserimento dell'utente");
          return;
        }
      }

      queue.push(user);

      if(queue.length == 6){
        var players = await TagPlayer(queue);
        
        var str = "6 Persone sono entrare nella queue e verrà creata la lobby.\n" +
        "**Players:** " + players + "\n" +
        "Scegliere la modalità della lobby, Capitani (.c) o Random (.r)";

        await Embed(channel, "Lobby", str);
        lobby.push(new preLobby(queue, channel));
        queue = [];
      }
      else{
        await Embed(channel,"Lista" , queue.length + ' giocatori nella lista!');
      }
        
    }
    else if(command === 'l' && queue.includes(user.id)){
      await queue.pop(user.id);
      await Embed(channel,"Lista" , queue.length + ' giocatori nella lista!');
    }
    else if(command === 'c'){
      
      var r = await getIdLobby(user);

      if(r < 0){
        Error(channel,"Errore" , "Non sei in nessuna lobby");
        return;
      }

      var l = lobby[r];

      l.addVote(user, "c");

      var vote = await l.getVote("c");
      var max = await l.getSizeQueue();

      console.log("voti:" + vote);
      if(vote > max/2){
      
        var players = await l.returnPlayers();
        var row = db.getScoreLobby("rl-3s", guild, players);
        var cap1 = await l.getPlayer(row[0].user);
        var cap2 = await l.getPlayer(row[1].user);

        await l.setCap(cap1, cap2);
        await SendDM(cap1, "Scegli un player", "Scrivi il numero del player che vuoi in squadra:\n" + await l.choosePlayer());
      }
      else{
        console.log("r");
      }
    }
    else if(command === 'r'){
      console.log("r");
    }
    else if(command === 'test'){

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
  else if((await isCap(user))){ //Sono nei DM e sono capitano
    
    const args = msg.content.split(' '); //splitto il comando e tutti gli argomenti (se ci sono)
    const command = args.shift().toLowerCase(); //prendo solo il comando

    var j = await getIdLobby(user);
    var l = lobby[j];
    var id = parseInt(command);

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

module.exports = { Body, setup};