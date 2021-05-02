// Database Better sqlite-3
const SQLite = require("better-sqlite3");
const sql = new SQLite('./db/user.sqlite');

//Funzione per la preparazione del database
async function dbStart() {
  //Controllo se la tabella esiste, altrimenti la creo, una per ogni modalità di rocket 

  //---------------------------------- USER ------------------------------
  sql.prepare("CREATE TABLE IF NOT EXISTS 'user' (id TEXT PRIMARY KEY, tag TEXT);").run();
  sql.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uniqueID ON 'user' (id);").run();

  //---------------------------------- ROCKET LEAGUE ------------------------------
  //3s
  sql.prepare("CREATE TABLE IF NOT EXISTS 'rl-3s' (id TEXT PRIMARY KEY, user TEXT, guild TEXT, win INTEGER, lose INTEGER, points INTEGER);").run();
  sql.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uniqueID ON 'rl-3s' (id);").run();

  //2s
  sql.prepare("CREATE TABLE IF NOT EXISTS 'rl-2s' (id TEXT PRIMARY KEY, user TEXT, guild TEXT, win INTEGER, lose INTEGER, points INTEGER);").run();
  sql.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uniqueID ON 'rl-2s' (id);").run();

  //1s
  sql.prepare("CREATE TABLE IF NOT EXISTS 'rl-1s' (id TEXT PRIMARY KEY, user TEXT, guild TEXT, win INTEGER, lose INTEGER, points INTEGER);").run();
  sql.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uniqueID ON 'rl-1s' (id);").run();

  //---------------------------------- LOBBY ------------------------------
  //3s
  sql.prepare("CREATE TABLE IF NOT EXISTS 'lobby' (id INTEGER PRIMARY KEY, team1 TEXT, team2 TEXT, date TEXT, reported TEXT, win TEXT);").run();
  sql.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uniqueID ON 'lobby' (id);").run();

  //Impostazioni Database
  sql.pragma("synchronous = 1");
  sql.pragma("journal_mode = wal");

  console.log(`DB ready!`);
}

//Funzione per ottenere i dati di un utente su una det tabella
async function getUser(table, userid, guildid){
  return await sql.prepare(`SELECT * FROM \'${table}\' WHERE user = ? AND guild = ?`).get(userid, guildid);
}

//Funzione per settare i dati di un utente su una det tabella nel db di una modalità
async function setUser(table, data){
  sql.prepare(`INSERT OR REPLACE INTO \'${table}\' (id, user, guild, win, lose, points) VALUES (@id, @user, @guild, @win, @lose, @points);`).run(data);
}

//Funzione per settare i dati di un utente sulla tabella utenti (per aggiornamenti nomi etc)
async function setGlobalUser(data){
  sql.prepare(`INSERT OR REPLACE INTO 'user' (id, tag) VALUES (@id, @tag);`).run(data);
}

//Funzione per ottenere i dati di un utente sulla tabella utenti
async function getGlobalUser(id){
  return await sql.prepare(`SELECT * FROM 'user' WHERE id = ?`).get(id);
}

//Funzione ottenere una leaderboard
async function getLead(table, limit, guild){
  return await sql.prepare(`SELECT * FROM \'${table}\' WHERE guild = ? ORDER BY points DESC LIMIT ?;`).all(guild.id, limit);
}

async function getScoreLobby(table, guild, users){

  str = "(";
  for(var i = 0; i < users.length ; i++){
    
    if(i < users.length-1)
      str += "\'"+ users[i] + "\', ";
    else
      str += "\'"+ users[i] + "\'";
  }
  str += ")";

  return await sql.prepare(`SELECT user, points FROM \'${table}\' WHERE user IN ${str} AND guild = ? ORDER BY points DESC LIMIT 2;`).all(guild.id);

}

async function getScore(table, guild, user){
  return await sql.prepare(`SELECT points FROM \'${table}\' WHERE guild = ? AND guild = ?;`).all(guild.id, user.id);
}

//Funzione per settare i dati di una lobby nel db
async function setLobby(data){
  sql.prepare(`INSERT OR REPLACE INTO \'lobby\' (id, team1, team2, date, reported, win) VALUES (@id, @team1, @team2, @date, @reported, @win);`).run(data);
}

//Funzione per ottenere le lobby
async function getLobby(){
  return await sql.prepare(`SELECT * FROM \'lobby\'`).all();
}

//Funzione per ottenere che devono essere ancora reportate
async function getLobbyReport(){
  const table = sql.prepare("SELECT count(*) AS num FROM sqlite_master WHERE type='table' AND name = 'lobby';").get();

  if(!table['num'])
    return 0;

  return await sql.prepare(`SELECT * FROM \'lobby\' WHERE win = \'\'`).all();
}

//Funzione per contare quante lobby esistono
async function count(table){
  return await sql.prepare(`SELECT COUNT(*) AS num FROM \'${table}\'`).get();
}

module.exports = { dbStart, getUser, setUser, getLead, getScoreLobby, getScore, setLobby, getLobby, getLobbyReport, count, setGlobalUser, getGlobalUser };