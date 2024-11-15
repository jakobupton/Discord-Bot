import { Client, GatewayIntentBits, REST, Routes, Collection, Events, ActivityType } from "npm:discord.js@14.14.1";
import { join } from "https://deno.land/std@0.106.0/path/mod.ts";
import "https://deno.land/x/dotenv/load.ts";
import { Player } from "npm:discord-player";

// Create client instance
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ]
});

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, any>;
  }
}

client.player = new Player(client, {
    ytdlOptions: {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    }
})

// Bot ready event
client.on("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  const commands = [];
  const commandFiles = [];
  for await (const dirEntry of Deno.readDir(join(Deno.cwd(), 'commands/utility'))) {
    if (dirEntry.isFile && dirEntry.name.endsWith('.ts')) {
      commandFiles.push(dirEntry.name);
    }
  }
  
  client.user?.setPresence({
    activities: [{ name: `for christmas noobs`, type: ActivityType.Watching}],
    status: 'dnd',
  })
  
  // Read all command files
  client.commands = new Collection();
  for (const file of commandFiles) {
    const command = await import(`./commands/utility/${file}`);
    client.commands.set(command.default.data.name, command.default);
    commands.push(command.default.data);
  }

  // Register Commands
  const rest = new REST({ version: '10' }).setToken(Deno.env.get('DISCORD_TOKEN')!);
  try {
    await rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: commands },
    );
  } catch (error) {
    console.error(error);
  }

});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

    try {
		await command.execute({client, interaction});
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
})

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    logToFile(`${message.author.displayName}(${message.author.username}): ${message.content}`);

    if (message.author.username === 'garyguys'){
        const reactions = ['🎄', '🇳', '🅾️', '🇴', '🅱️'];
        for (const reaction of reactions){
            await message.react(reaction);
        }
    }
})

function getFormattedTime(){
    const myDate = new Date();
    const pstDate = myDate.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles"
    })
    return pstDate;
  }
  
  function logToFile(message: string){
    Deno.writeTextFile('log.txt', `[${getFormattedTime()}] ${message}\n`, {append: true});
  }

client.login(Deno.env.get('DISCORD_TOKEN'));