import { Client, EmbedBuilder, TextChannel } from "discord.js";

interface EmbedObj{
  title: string;
  url: string;
  author: {
    name: string;
    icon_url: string;
  };
  description: string;
  color: number;
  thumbnail: {
    url: string;
  };
  fields: Array<{
    name: string;
    value: string;
    inline: boolean;
  }>;
  footer: {
    text: string;
  };
  timestamp: string;
}
interface WebhookPayload {
  channelId: string;
  content?: string;
  flags?: number;
  embeds: EmbedObj[];
}

export default async function tautulliWebhookHandler(client: Client, payload: WebhookPayload) {
    const {
        channelId,
        embeds,
        content,
        flags
    } = payload;
    try {
        const channel = await client.channels.fetch(channelId) as TextChannel;
        const message = new EmbedBuilder()
          .setTitle(embeds?.[0]?.title || 'No Title')
          .setURL(embeds?.[0]?.url || '')
          .setDescription(embeds?.[0]?.description || '')
          .setColor(embeds?.[0]?.color || [255, 255, 255])
          .setThumbnail(embeds?.[0]?.thumbnail?.url || '')
          .setFields(embeds?.[0]?.fields || [])
          .setAuthor({
            name: embeds?.[0]?.author?.name || '',
            iconURL: embeds?.[0]?.author?.icon_url || ''
          })
          .setFooter({ text: embeds?.[0]?.footer?.text || '' })
          .setTimestamp(Date.now());
        await channel.send({ content, embeds: [message] , flags});
    } catch (error) {
      console.error('Error sending message from webhook:', error);
    }
}