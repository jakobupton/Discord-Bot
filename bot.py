import discord
import time
import openai
import os
from dotenv import load_dotenv

load_dotenv()
token = str(os.getenv('DISC_TOKEN'))
openai.api_key = os.getenv('OPENAI_KEY')
print(openai.Model.list())
allMembersData = {}


def run_discord_bot():
    bot = discord.Bot(intents=discord.Intents.all())

    @bot.event
    async def on_ready():  # Bot ready, print message
        print(bot.user.name + " logged in successfully at " + time.strftime("%H:%M:%S", time.localtime()))
        for member in bot.users:
            if not member.bot:
                allMembersData[member.id] = {}

    @bot.slash_command(description="Ask ChatGPT!")
    async def gpt(ctx, question):
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": question}
            ]
        )
        await ctx.respond(ctx.author.name + " asked: " + question + str(completion.choices[0].message['content']))

    @bot.event
    async def on_voice_state_update(member, before, after):
        generalChat = member.guild.system_channel
        if before.channel is None and after.channel is not None:  # Joins Channel
            await generalChat.send(
                member.name + " " + str(member.id) + " joined at " + time.strftime("%H:%M:%S", time.localtime()))
        elif before.channel is not None and after.channel is None:  # leaves Channel
            await generalChat.send(
                member.name + " " + str(member.id) + " left at " + time.strftime("%H:%M:%S", time.localtime()))
        elif before.channel is not None and after.channel is not None:  # switches channel
            await generalChat.send(member.name + " " + str(
                member.id) + " changed from " + before.channel.name + " to " + after.channel.name + " at " + time.strftime(
                "%H:%M:%S", time.localtime()))

    @bot.event
    async def on_message(message):
        if message.author == bot.user:
            return
        await message.channel.send("yo")

    bot.run(token)
