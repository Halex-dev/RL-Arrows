// Database Better sqlite-3
const SQLite = require("better-sqlite3");
const sql = new SQLite('./db/user.sqlite');

//Funzione per la preparazione del database
function dbStart() {
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
  sql.prepare("CREATE TABLE IF NOT EXISTS 'lobby' (id TEXT PRIMARY KEY, team1 TEXT, team2 TEXT, data TEXT, win INTEGER);").run();
  sql.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uniqueID ON 'lobby' (id);").run();

  //Impostazioni Database
  sql.pragma("synchronous = 1");
  sql.pragma("journal_mode = wal");

  console.log(`DB ready!`);
}

//Funzione per ottenere i dati di un utente su una det tabella
function getUser(table, userid, guildid){
  return sql.prepare(`SELECT * FROM \'${table}\' WHERE user = ? AND guild = ?`).get(userid, guildid);
}

//Funzione per settare i dati di un utente su una det tabella nel db
function setUser(table, data){
  sql.prepare(`INSERT OR REPLACE INTO \'${table}\' (id, user, guild, tag, win, lose, points) VALUES (@id, @user, @guild, @tag, @win, @lose, @points);`).run(data);
}

function getLead(table, limit, guild){
  return sql.prepare(`SELECT * FROM \'${table}\' WHERE guild = ? ORDER BY points DESC LIMIT ?;`).all(guild.id, limit);
}

function getScoreLobby(table, guild, users){

  str = "(";
  for(var i = 0; i < users.length ; i++){
    
    if(i < users.length-1)
      str += "\'"+ users[i] + "\', ";
    else
      str += "\'"+ users[i] + "\'";
  }
  str += ")";

  return sql.prepare(`SELECT user, points FROM \'${table}\' WHERE user IN ${str} AND guild = ? ORDER BY points DESC LIMIT 2;`).all(guild.id);

}

function getScore(table, guild, user){
  return sql.prepare(`SELECT points FROM \'${table}\' WHERE guild = ? AND guild = ?;`).all(guild.id, user.id);
}

module.exports = { dbStart, getUser, setUser, getScoreLobby, getLead};