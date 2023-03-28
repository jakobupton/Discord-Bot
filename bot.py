import asyncio
import random
import discord
import time
import openai
import os
from dotenv import load_dotenv

load_dotenv()
token = str(os.getenv('DISC_TOKEN'))
openai.api_key = os.getenv('OPENAI_KEY')
# allMembersData = {}


def run_discord_bot():
    bot = discord.Bot(intents=discord.Intents.all())

    @bot.event
    async def on_ready():  # Bot ready, print message
        print(bot.user.name + " logged in successfully at " + time.strftime("%H:%M:%S", time.localtime()))
        # for member in bot.users:
        #     if not member.bot:
        #         allMembersData[member.id] = {}

    @bot.slash_command(description="Flip a coin!")
    async def flip(ctx):
        flipRandom = random.randint(0, 1)
        embed = discord.Embed(title="🪙Coin Flip🪙", url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                              description="{name} flipped a coin and got {outcome}!".format(name=ctx.author.name,
                                                                                            outcome="heads" if flipRandom == 0 else "tails"))  # set text based on outcome
        embed.set_image(
            url="https://i.imgur.com/smWP3ez.png" if flipRandom == 0 else "https://i.imgur.com/DC00SAL.png")  # set picture based on outcome
        embed.set_footer(text="Live by the coin, die by the coin.")
        await ctx.respond(embed=embed)

    @bot.slash_command(description="Ask ChatGPT!")
    async def gpt(ctx, question):
        await ctx.respond("Working on that...")
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": question}
            ]
        )
        await ctx.edit(content="<@"+str(ctx.author.id) + "> asked: " + question + "\n GPT says: " + str(completion.choices[0].message['content'])) #formatted message to @ the user and give the reply

    # @bot.event
    # async def on_voice_state_update(member, before, after):
    #     generalChat = member.guild.system_channel
    #     if before.channel is None and after.channel is not None:  # Joins Channel
    #         await generalChat.send(
    #             member.name + " " + str(member.id) + " joined at " + time.strftime("%H:%M:%S", time.localtime()))
    #     elif before.channel is not None and after.channel is None:  # leaves Channel
    #         await generalChat.send(
    #             member.name + " " + str(member.id) + " left at " + time.strftime("%H:%M:%S", time.localtime()))
    #     elif before.channel is not None and after.channel is not None:  # switches channel
    #         await generalChat.send(member.name + " " + str(
    #             member.id) + " changed from " + before.channel.name + " to " + after.channel.name + " at " + time.strftime(
    #             "%H:%M:%S", time.localtime()))

    @bot.event
    async def on_message(message):
        if message.author == bot.user:
            return
        if message.author.name == 'gary guys':
            await message.add_reaction('🎄')
            await message.add_reaction('🇳')
            await message.add_reaction('🅾️')
            await message.add_reaction('🇴')
            await message.add_reaction('🅱️')
        print(message.author.name + " said: " + message.content)

    bot.run(token)
