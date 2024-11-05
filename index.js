// Load environment variables
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();

// Load all commands from the commands folder
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
      fs.appendFile('log.txt', `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.\n`, (err) => {
        if (err) throw err;
      }
    );
		}
	}
}

// Event: When the bot is ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Event: When a message is received
client.on('messageCreate', message => {
  // If the message is from the bot, return
  if (message.author.bot) return;
  fs.appendFileSync('log.txt', `[${getFormattedTime()}] [${message.author.tag} in ${message.channel.name}]: ${message.content}\n`);
  if (message.author.username == "garyguys"){
    // Log to a file
    message.react('🎄');
    message.react('🇳');
    message.react('🅾️');
    message.react('🇴');
    message.react('🅱️');
    message.react('🌲');
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  fs.appendFileSync('log.txt', `[${getFormattedTime()}] Received command: ${interaction.commandName} from ${interaction.user.tag}\n`);
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});


function getFormattedTime(){
  var myDate = new Date();
  var pstDate = myDate.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles"
  })
  return pstDate;
}

// Log in to Discord with the bot token
client.login(process.env.DISCORD_TOKEN);