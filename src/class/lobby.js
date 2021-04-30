'use strict'

const internal = {};

module.exports = class PreLobby{
  constructor(data, db) {
    this.id = data.id;
    this.team1 = data.team1; // Qualcosa tipo cosi [id, id, id, id]
    this.team2 = data.team2;
    this.date = data.date;
    this.win = data.win;

    if(db){ //Se era crashato e recupero le lobby dal db
      var tmp = this.team1.split(',');
      var array = [];

      for(var i = 0; i < tmp1.length ; i++){
          array.push(parseInt(tmp[i]));
      }
      this.team1 = array;
      tmp = this.team2.split(',');
      array = [];

      for(var i = 0; i < team2.length ; i++){
          array.push(parseInt(tmp[i]));
      }
      this.team2 = array;
    }

  }

  
 };