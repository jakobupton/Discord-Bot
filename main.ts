import { Client, GatewayIntentBits, REST, Routes, Collection, Events, ActivityType, TextChannel, MessageFlags, PresenceUpdateStatus } from "discord.js";
import * as fs from "node:fs";
import * as http from "node:http";
import * as dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import tautulliWebhookHandler from "./tautulli/webhook-handle.js";
import overseerrWebhookHandler from "./overseerr/webhook-handle.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Bot ready event
client.on("clientReady", async () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  const commands = [];
  const commandsPath = join(__dirname, "commands", "utility")
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts"));
  
  client.user?.setPresence({
    activities: [{ name: 'christmas noobs', type: ActivityType.Watching}],
    status: PresenceUpdateStatus.Online,
  })
  
  client.commands = new Collection();
  for (const file of commandFiles) {
    const command = await import(`./commands/utility/${file}`);
    client.commands.set(command.default.data.name, command.default);
    commands.push(command.default.data);
  }

  // Register Commands
  const token = process.env.DISCORD_TOKEN!;
  const rest = new REST({ version: '10' }).setToken(token);
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

    if (message.author.id === '362841133971275776'){
        const reactions = ['🎄', '🇳', '🅾️', '🇴', '🅱️'];
        for (const reaction of reactions){
            await message.react(reaction);
        }
    }
})

  

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error("DISCORD_TOKEN is not set in environment variables.");
}

client.login(token);

// Webhook server
const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3000;
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/webhook';

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === WEBHOOK_PATH) {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      console.log(body);
      try {
        const payload = JSON.parse(body);
        console.log('Webhook received:', payload);
        switch(payload.origin){
          case 'tautulli':
            await tautulliWebhookHandler(client, payload);
            break;
          case 'overseerr':
            await overseerrWebhookHandler(client, payload);
            break;
          default:
            console.warn('Unknown webhook origin:', payload.origin);
            break;
        }
        
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Webhook received' }));
      } catch (error) {
        console.error('Webhook processing error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid payload' }));
      }
    });
  }else if (req.method === 'GET' && req.url === '/health'){
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(WEBHOOK_PORT, () => {
  console.log(`Webhook server listening on port ${WEBHOOK_PORT}`);
  console.log(`Webhook endpoint: http://localhost:${WEBHOOK_PORT}${WEBHOOK_PATH}`);
});