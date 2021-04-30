const Discord = require("discord.js")

//Librerie 
const fun = require("./src/lib/function.js");

// Extract the required classes from the discord.js module
const { Client, MessageEmbed } = require('discord.js');

// Create an instance of a Discord client
const client = new Client();

//Funzione per quando il bot va in run
function Ready() {
  try{
    fun.setup(client, MessageEmbed);
    var str = `-------------RL Arrows v1.0---------------\n`+
              `Logged in as ${client.user.tag}!\n`+
              `-----------------------------------------`;
    console.log(str);
  }
  catch(e){
    console.log(`Error: ` + e);
  }
}

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
