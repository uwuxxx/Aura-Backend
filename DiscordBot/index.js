const { MessageEmbed } = require("discord.js");
const functions = require("../../../structs/functions.js");
const Badwords = require("bad-words");

const unava = "[]{}':|.,!@#$%^&*()+";
const number = "1234567890";
const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
function generatePassword(length = 16) {
    return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join("");
}

function validateUsername(username) {
    if (username.length >= 25) return "Your username must be less than 25 characters long.";
    if (username.length < 3) return "Your username must be at least 3 characters long.";
    if (unava.test(username)) return "Your username can only contain letters, numbers, and underscores.";
    if (number.test(username)) return "Your username only contains numbers, please add letters to the start or end.";
    return null;
}

if (!functions.registerUser) {
    console.warn("Warning: registerUser function is not defined in functions.js");
}


function buildEmbed(interaction, resp, { username, email, password }) {
    const success = resp.status < 400;
    return new MessageEmbed()
        .setColor(success ? "#56ff00" : "#ff0000")
        .setThumbnail(interaction.user.avatarURL({ format: "png", dynamic: true, size: 256 }))
        .addFields(
            { name: "Message", value: success ? "Successfully created an account." : resp.message },
            { name: "Username", value: username },
            { name: "Email", value: email },
            { name: "Password", value: `\`${password}\`` },
            { name: "Discord Tag", value: interaction.user.tag }
        )
        .setTimestamp()
        .setFooter({ text: "Aura Backend", iconURL: "https://uwuxxx.github.io/image/news.png" });
}

module.exports = {
    commandInfo: {
        name: "register",
        description: "Creates an account on Aura Services.",
        options: [
            {
                name: "username",
                description: "Your username.",
                required: true,
                type: 3
            }
        ]
    },

    execute: async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        try {
            const username = interaction.options.get("username").value;
            const validationError = validateUsername(username);

            if (validationError) {
                return interaction.editReply({ content: validationError, ephemeral: true });
            }

            const discordId = interaction.user.id;
            const discordUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "");
            const email = `${discordUsername}@aurafn.xyz`;
            const password = generatePassword();

            const resp = await functions.registerUser(discordId, username, email, password);
            const embed = buildEmbed(interaction, resp, { username, email, password });

            if (resp.status >= 400) {
                return interaction.editReply({ embeds: [embed], ephemeral: true });
            }

            try {
                await interaction.user.send({ embeds: [embed] });
            } catch {
                console.log(`DM failed for ${interaction.user.tag}`);
            }

            return interaction.editReply({ content: "Account created! check your DMS for your infomation.", ephemeral: true });

        } catch (err) {
            console.error("Register command error:", err);
            return interaction.editReply({ content: "An error occurred while creating your account. Please try again.", ephemeral: true });
        }
    }
};
