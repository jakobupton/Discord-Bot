import { SlashCommandBuilder } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { QueryType } from "discord-player";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song from YouTube.")
    .addSubcommand(subcommand =>
      subcommand
        .setName("search")
        .setDescription("Searches for a song and plays it")
        .addStringOption(option =>
          option.setName("searchterms").setDescription("search keywords").setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("song")
        .setDescription("Plays a single song from URL")
        .addStringOption(option => option.setName("url").setDescription("the song's url").setRequired(true))
    ),
  async execute({client, interaction}: any) {
    if (!interaction.member.voice.channel) { return await interaction.reply({ content: 'You need to enter a voice channel before use the command', ephemeral: true }) }

    const queue = await client.player.nodes.create(interaction.guild);
    if (!queue.connection){ await queue.connect(interaction.member.voice.channel);}

    let embed = new EmbedBuilder()

    if (interaction.options.getSubcommand() === 'search'){
      let url = interaction.options.getString("searchterms");
      const result = await client.player.search(url,{
        requestedBy: interaction.user,
        searchEngine: QueryType.AUTO
      });

      const song = result.tracks[0];
      await queue.addTrack(song);
      // fix song.title (can't read properties of undefined)
      embed
        .setDescription(`**[${song.title}](${song.url})** has been added to the queue`)
        .setThumbnail(song.thumbnail)
        .setFooter({ text: `Duration: ${song.duration}`});

    }else if (interaction.options.getSubcommand() === 'song'){
      let url = interaction.options.getString("url");
      const result = await client.player.search(url, {
        requestedBy: interaction.user,
        searchEngine: QueryType.YOUTUBE_VIDEO
      });
      if (result.tracks.length === 0){
        interaction.reply("No Results");

      }
      const song = result.tracks[0];
      await queue.addTrack(song);
      embed
        .setDescription(`**[${song.title}](${song.url})** has been added to the queue`)
        .setThumbnail(song.thumbnail)
        .setFooter({ text: `Duration: ${song.duration}`});
    }
    if (!queue.playing) await queue.play();
    await interaction.reply({ embeds: [embed] });
  }
};