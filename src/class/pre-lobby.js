'use strict'

const internal = {};

module.exports = class PreLobby{

  constructor(players, channel) {
      this.players = players;
      this.channel = channel;
      this.choose = 1;
      this.team1 = [];
      this.team2 = [];
      this.voto = {
        r: [],
        c: []
      }
  }

  //Funzione aggiunge un voto
  addVote(user, type){
    if(this.alreadyVote(user, type))
      return;

    if(type === "r")
      this.voto.r.push(user.id);
    else
      this.voto.c.push(user.id);
  }

  //Funzione aggiunge un voto
  alreadyVote(user, type){
    if(type === "r")
      return this.voto.r.includes(user.id);
    else
      return this.voto.c.includes(user.id);
  }

  //Funzione che sceglie un player da inserire nel team
  chooseMember(me, user){

    if(this.firstCap(me.id)){
      this.addTeam1(user);
    }
    else{
      this.addTeam2(user);
    }

    if(this.players.length === 1){    
      this.addTeam2(this.players[0]);
    }

    this.choose++;
  }

  //Funzione che rimuove un player dalla scelta
  remPlayer(user){
    var index = this.getIndexPlayer(user.id);

    if(index == -1) return;

    var data = this.players;
    
    data.splice(index, 1);

  }

  //Funzione che aggiunge un utente al team1
  addTeam1(user){
    this.team1.push(user);
    this.remPlayer(user);
  }

  addTeam2(user){
    this.team2.push(user);
    this.remPlayer(user);
  }

  //Funzione aggiunge un voto
  async getVote(type){
    var vote;
    if(type === "r")
      vote = this.voto.r.length;
    else
      vote = this.voto.c.length;

    return new Promise(function(resolve, reject) {
      resolve(vote);
    });
  }

  
  //Funzione che restituisce true o false in base se l'utente appartiene a questa lobby
  async hasPlayer(userid){
    var i = 0;
    var id = -1;

    while(i < this.players.length && id < 0){
      if(this.players[i].id == userid || await this.isCap(userid)){
        id = i;
      }
      i++;
    }

    return new Promise(function(resolve, reject) {
      resolve(id >= 0);
    });
  }

  //Funzione che restituisce se tocca all'utente scegliere
  async myTurn(userid){
    var cap1 = await this.getCap1();
    var cap2 = await this.getCap2();
    var choose = this.choose;

    return new Promise(function(resolve, reject) {
      if(cap1.id === userid){
        resolve(choose % 2 === 1);
      }
      else if(cap2.id === userid){
        resolve(choose % 2 === 0);
      }
      
    });
  }

  //Funzione che restituisce tutti i player della lobby non ancora scelti
  async returnPlayers(){
    var data = this.players;
    return new Promise(function(resolve, reject) {
      resolve(data);
    });
  }

  //Funzione che restituisce una stringa con i giocatori rimanenti da scegliere
  async choosePlayer(){
    var data = this.players;
    var str = "";
    
    for(var i = 0; i < data.length ; i++){
        str += (i+1) + " ---> " + "<@"+ data[i].id + ">\n";
    }

    return new Promise(function(resolve, reject) {
      resolve(str);
    });
  }

   //Funzione che restituisce una stringa con i giocatori rimanenti da scegliere
  async teamToString(){
    var str = "**Team1:**\n";
    
    for(var i = 0; i < this.team1.length ; i++){
        str += "<@"+ this.team1[i].id + ">";
    }

    str += "\n**Team 2:**\n";

    for(var i = 0; i < this.team2.length ; i++){
        str += "<@"+ this.team2[i].id + ">";
    }

    return new Promise(function(resolve, reject) {
      resolve(str);
    });
  }

  //Funzione che incrementa di uno il voto di r
  async incR(){
    this.voto.r++;
  }

  //Funzione che incrementa di uno il voto di c
  async incC(){
    this.voto.c++;
  }

  //Funzione che restituisce i voti di c
  async getC(){
    var data = this.voto.c;
    return new Promise(function(resolve, reject) {
      resolve(data);
    });
  }

  //Funzione che restituisce i voti di r
  async getR(){
    var data = this.voto.r;
    return new Promise(function(resolve, reject) {
      resolve(data);
    });
  }

  //Funzione che restituisce la classe user dell'utente cercato
  async getPlayer(userid){
    var i = 0;
    var id = -1;

    var data = this.players;

    while(i < data.length && id < 0){

      if(data[i].id == userid){
        id = i;
      }
      i++;
    }
    return new Promise(function(resolve, reject) {
      if(id >= 0)
        resolve(data[id]);
      else
        resolve(-1);
    });
  }

  //Funzione che restituisce la classe user dell'utente cercato tramite index
  async getPlayerByIndex(index){
    var data = this.players;
    return new Promise(function(resolve, reject) {
      try{
        resolve(data[index]);
      }
      catch (e) {
        reject(-1);
      }
      
    });
  }

  //Funzione che restituisce la classe user dell'utente cercato tramite index
  async getSizeQueue(){
    var data = this.players;

    return new Promise(function(resolve, reject) {
        resolve(data.length);
    });
  }

  //Funzione che restituisce la classe user dell'utente cercato tramite index
  async getIndexPlayer(userid){
    var i = 0;
    var id = -1;

    var data = this.players;

    while(i < data.length && id < 0){
      if(data[i].id === userid){
        id = i;
      }
      i++;
    }
    return new Promise(function(resolve, reject) {
      resolve(id);
    });
  }

  //Funzione per impostare i capitani (li rimuove automaticamente dalla lista)
  async setCap(cap1, cap2){
    this.addTeam1(cap1);
    this.addTeam2(cap2);
  }

  //Funzione che restituisce true se sei il primo capitano, false altrimenti
  async firstCap(userid){
    var c1 = await this.getCap1();

    return new Promise(function(resolve, reject) {
      resolve(c1.id === userid);     
    });
  }

  //Funzione che restituisce true o false in base se l'utente è capitano
  async isCap(userid){
    var c1 = await this.getCap1();
    var c2 = await this.getCap2();

    return new Promise(function(resolve, reject) {
      if(c1 && c2)
        resolve(c1.id === userid || c2.id === userid);
      else
        resolve(false);
    });
  }

  //Funzione che restituisce il secondo capitano
  async getCap2(){
    var c2 = this.team2[0];

    if(!c2)
      return;

    return new Promise(function(resolve, reject) {
      resolve(c2);
    });
  }

  //Funzione che restituisce il primo capitano
  async getCap1(){
    var c1 = this.team1[0];

    if(!c1)
      return;

    return new Promise(function(resolve, reject) {
      resolve(c1);
    });
  }

  //Funzione che restituisce il primo capitano
  async getChannel(){
    var ch = this.channel;
    return new Promise(function(resolve, reject) {
      resolve(ch);
    });
  }

  //Funzione che restituisce il primo capitano
  async getChannel(){
    var ch = this.channel;
    return new Promise(function(resolve, reject) {
      resolve(ch);
    });
  }
 };