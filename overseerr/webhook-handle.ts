import { Client, EmbedBuilder, TextChannel } from "discord.js";

interface OverseerrPayload {
  channelId: string;
  notification_type: NotificationType;
  event: string;
  subject: string;
  message: string;
  image: string;
  media: {
    media_type: 'movie' | 'tv';
    tmdbId: string;
    tvdbId: string;
    status: MediaStatus;
    status4k: MediaStatus;
  };
  request: {
    request_id: string;
    requestedBy_email: string;
    requestedBy_username: string;
    requestedBy_avatar: string;
    requestedBy_settings_discordId: string;
    requestedBy_settings_telegramChatId: string;
  };
  issue: null | any;
  comment: null | any;
  extra: any[];
}

enum NotificationType {
    AutoApproved = "MEDIA_AUTO_APPROVED",
    Available = "MEDIA_AVAILABLE",
}

enum MediaStatus {
    Unknown = "UNKNOWN",
    Pending = "PENDING",
    Processing = "PROCESSING",
    PartiallyAvailable = "PARTIALLY_AVAILABLE",
    Available = "AVAILABLE",
}

const MediaType : Record<string, string> = {
    movie: "Movies",
    tv: "TV Shows",
}

function formatAuthorName(username: string, event: NotificationType): string {
    switch (event) {
        case NotificationType.AutoApproved:
            return `${username} requested`;
        case NotificationType.Available:
            return `${username}'s request is now available`;
        default:
            return username;
    }
}

function formatColor(event: NotificationType): [number, number, number] {
    switch (event) {
        case NotificationType.AutoApproved:
            return [139, 70, 233]; // Purple
        case NotificationType.Available:
            return [47, 204, 112]; // Green
        default:
            return [90, 185, 255]; // Default to pretty blue
    }
}

function formatStatus(status: MediaStatus): string {
    status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
}

export default async function overseerrWebhookHandler(client: Client, payload: OverseerrPayload) {
    try {
        const {
            channelId,
            notification_type,
            subject,
            message,
            image,
            media,
            request,
        } = payload
        const channel = await client.channels.fetch(channelId) as TextChannel;
        const builtEmbed = new EmbedBuilder()
          .setTitle(subject)
          .setURL(`https://requests.jakobupton.dev/${media.media_type === 'movie' ? 'movie' : 'tv'}/${media.tmdbId}`)
          .setDescription(message)
          .setColor(formatColor(notification_type))
          .setFields(
            { name: 'Status', value: formatStatus(media.status), inline: true },
            { name: 'Request #', value: request.request_id.toString(), inline: true },
            ...payload.extra
          )
          .setThumbnail(image)
          .setAuthor({
            name: formatAuthorName(request.requestedBy_username, notification_type),
            iconURL: request.requestedBy_avatar
          })
          .setFooter({ text: `jakeplex \u2022 ${MediaType[media.media_type]}` })
          .setTimestamp(Date.now());

        // silent notification for anything other than available
        await channel.send({ 
            content: request.requestedBy_settings_discordId && notification_type === NotificationType.Available ? `<@${request.requestedBy_settings_discordId}>` : undefined, 
            embeds: [builtEmbed], 
            flags: notification_type !== NotificationType.Available ? 4096: undefined
        });
    } catch (error) {
      console.error('Error sending message from webhook:', error);
    }
}