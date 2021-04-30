'use strict'

const internal = {};

module.exports = class PreLobby{

  constructor(players, channel) {
      this.players = players.slice();
      this.channel = channel;
      this.choose = 1;
      this.team1 = [];
      this.team2 = [];
      this.voto = {
        votable: false,
        r: [],
        c: []
      }
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
    
    return id;
  }

  //Funzione per impostare i capitani (li rimuove automaticamente dalla lista)
  async setCap(cap1, cap2){
    await this.addTeam1(cap1);
    await this.addTeam2(cap2);
  }

  //Funzione aggiunge un voto
  async addVote(user, type){
    /*if(this.alreadyVote(user, type))
      return;*/

    if(type === "r")
      await this.voto.r.push(user.id);
    else
      await this.voto.c.push(user.id);
  }

  //Funzione che restituisce true se sei il primo capitano, false altrimenti
  async firstCap(userid){
    var c1 = await this.getCap1();

    if(c1 === undefined)
      return false;

    if(c1.id === userid)
      true;
    else
      false;
  }

  //Funzione aggiunge un voto
  async alreadyVote(user, type){
    if(type === "r")
      return this.voto.r.includes(user.id);
    else
      return this.voto.c.includes(user.id);
  }

  //Funzione che sceglie un player da inserire nel team
 async chooseMember(me, user){

    if(await this.firstCap(me.id)){
      await this.addTeam1(user);
    }
    else{
      await this.addTeam2(user);
    }

    if(this.players.length === 1){    
      await this.addTeam2(this.players[0]);
    }

    this.choose++;
  }

  //Funzione che rimuove un player dalla scelta
  async remPlayer(user){
    var index = await this.getIndexPlayer(user.id);

    if(index == -1) return;

    await this.players.splice(index, 1);
  }

  //Funzione che aggiunge un utente al team1
  async addTeam1(user){
    await this.team1.push(user);
    await this.remPlayer(user);
  }

  //Funzione che aggiunge un utente al team2
  async addTeam2(user){
    await this.team2.push(user);
    await this.remPlayer(user);
  }

  //Funzione restituisce il primo team
  async getTeam1(user){
    return this.team1;
  }

  //Funzione restituisce il secondo team
  async getTeam2(user){
    return this.team2;
  }

  //Funzione aggiunge un voto
  async getVote(type){
    var vote;
    if(type === "r")
      vote = this.voto.r.length;
    else
      vote = this.voto.c.length;

    return vote;
  }

  
  //Funzione che restituisce true o false in base se l'utente appartiene a questa lobby
  async hasPlayer(userid){
    var i = 0;
    var id = -1;

    while(id < 0 && i < this.players.length ){
      if(this.players[i].id == userid){
        id = i;
      }  
      i++;
    }

    while(id < 0 && i < this.team1.length ){
      if(this.team1[i].id == userid){
        id = i;
      }  
      i++;
    }

    while(id < 0 && i < this.team2.length ){
      if(this.team2[i].id == userid){
        id = i;
      }  
      i++;
    }

    if(id >= 0)
      return true;
    else
      return false;
  }

  //Funzione che restituisce se tocca all'utente scegliere
  async myTurn(userid){
    var cap1 = await this.getCap1();
    var cap2 = await this.getCap2();
    var choose = this.choose;

    if(await this.firstCap(userid)){
      if(choose % 2 === 1)
        return true;
      else{
        return false;
      }
    }
    else{
      if(choose % 2 === 0)
        return true;
      else{
        return false;
      }
    }
  }

  //Funzione che restituisce tutti i player della lobby non ancora scelti
  async returnPlayers(){
    return this.players;
  }

  //Funzione che restituisce una stringa con i giocatori rimanenti da scegliere
  async choosePlayer(){
    var data = this.players;
    var str = "";
    
    for(var i = 0; i < data.length ; i++){
        str += (i+1) + " ---> " + "<@"+ data[i].id + ">\n";
    }

    return str;
  }

   //Funzione che restituisce una stringa con i giocatori rimanenti da scegliere
  async teamToString(){
    var str = "**Team1:**\n";
    
    for(var i = 0; i < this.team1.length ; i++){
      if(i < this.team1.length-1)
        str += "<@"+ this.team1[i].id + ">, ";
      else
        str += "<@"+ this.team1[i].id + ">";
    }

    str += "\n**Team 2:**\n";

    for(var i = 0; i < this.team2.length ; i++){
      if(i < this.team2.length-1)
        str += "<@"+ this.team2[i].id + ">, ";
      else
        str += "<@"+ this.team2[i].id + ">";
    }

    return str;
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
    return this.voto.c;
  }

  //Funzione che restituisce i voti di r
  async getR(){
    return this.voto.r;
  }

  //Funzione che restituisce se la lobby è ancora votabile o no
  async isVotable(){
    return this.voto.votable;
  }

  //Funzione che restituisce se la lobby è ancora votabile o no
  async setNoVotable(){
    this.voto.votable = true;
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

    if(id >= 0)
      return data[id];
    else
      return -1;
  }

  //Funzione che restituisce la classe user dell'utente cercato tramite index
  async getPlayerByIndex(index){
    try{
      return this.players[index];
    }
    catch (e) {
      return -1;
    }
  }

  //Funzione che restituisce la classe user dell'utente cercato tramite index
  async getSizeQueue(){
    return this.players.length;
  }

  //Funzione che restituisce true o false in base se l'utente è capitano
  async isCap(userid){
    var c1 = await this.getCap1();
    var c2 = await this.getCap2();

    if(c1 === undefined && c2 === undefined)
      return false;

    if(c1.id === userid || c2.id === userid)
      return true;
    else
      return false;
  }

  //Funzione che restituisce il secondo capitano
  async getCap2(){
    var c2 = this.team2[0];

    if(!c2)
      return;

    return c2;
  }

  //Funzione che restituisce il primo capitano
  async getCap1(){
    var c1 = this.team1[0];

    if(!c1)
      return;

    return c1;
  }

  //Funzione che restituisce il channel in cui era stata creata la lobby
  async getChannel(){
    return this.channel;
  }

  //Funzione che restituisce il channel in cui era stata creata la lobby
  async getPlayers(){
    return this.players;
  }
 };