// Database Better sqlite-3
const SQLite = require("better-sqlite3");
const sql = new SQLite('./db/user.sqlite');

//Funzione per la preparazione del database
async function dbStart() {
  //Controllo se la tabella esiste, altrimenti la creo, una per ogni modalità di rocket 

  //---------------------------------- ROCKET LEAGUE ------------------------------
  //3s
  sql.prepare("CREATE TABLE IF NOT EXISTS 'rl-3s' (id TEXT PRIMARY KEY, user TEXT, guild TEXT, tag TEXT, win INTEGER, lose INTEGER, points INTEGER);").run();
  sql.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uniqueID ON 'rl-3s' (id);").run();

  //2s
  sql.prepare("CREATE TABLE IF NOT EXISTS 'rl-2s' (id TEXT PRIMARY KEY, user TEXT, guild TEXT, tag TEXT, win INTEGER, lose INTEGER, points INTEGER);").run();
  sql.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uniqueID ON 'rl-2s' (id);").run();

  //1s
  sql.prepare("CREATE TABLE IF NOT EXISTS 'rl-1s' (id TEXT PRIMARY KEY, user TEXT, guild TEXT, tag TEXT, win INTEGER, lose INTEGER, points INTEGER);").run();
  sql.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uniqueID ON 'rl-1s' (id);").run();

  //---------------------------------- LOBBY ------------------------------
  //3s
  sql.prepare("CREATE TABLE IF NOT EXISTS 'lobby' (id TEXT PRIMARY KEY, team1 TEXT, team2 TEXT, date TEXT, win TEXT);").run();
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

//Funzione per settare i dati di un utente su una det tabella nel db
async function setUser(table, data){
  sql.prepare(`INSERT OR REPLACE INTO \'${table}\' (id, user, guild, tag, win, lose, points) VALUES (@id, @user, @guild, @tag, @win, @lose, @points);`).run(data);
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
  sql.prepare(`INSERT OR REPLACE INTO \'lobby\' (id, team1, team2, date, win) VALUES (@id, @team1, @team2, @date, @win);`).run(data);
}

//Funzione per ottenere le lobby
async function getLobby(){
  return await sql.prepare(`SELECT * FROM \'lobby\'`).get();
}

//Funzione per ottenere le lobby
async function count(table){
  return await sql.prepare(`COUNT(*) FROM \'${table}\'`).get();
}

module.exports = { dbStart, getUser, setUser, getLead, getScoreLobby, getScore, setLobby, getLobby, count };