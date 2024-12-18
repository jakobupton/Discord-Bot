import { EmbedBuilder } from "discord.js";

export default {
    data: {
        name: "flip",
        description: "Flip a coin",
    },
    async execute({client, interaction}: any) {
        const flipRandom = Math.floor(Math.random() * 2);
        const outcome = flipRandom === 0 ? 'heads' : 'tails';
        
        const embed = new EmbedBuilder()
            .setTitle('🪙 Coin Flip 🪙')
            .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
            .setDescription(`${interaction.user.username} flipped a coin and got ${outcome}!`)
            .setImage(flipRandom === 0 ? 'https://i.imgur.com/smWP3ez.png' : 'https://i.imgur.com/DC00SAL.png')
            .setFooter({ text: 'Live by the coin, die by the coin.' });

        await interaction.reply({ embeds: [embed] });
    }
};