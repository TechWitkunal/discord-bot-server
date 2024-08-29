require('dotenv').config();

const { REST, Routes } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const commands = [
    new SlashCommandBuilder()
        .setName('new-product')
        .setDescription('New product')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of product')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('details')
                .setDescription('Details of product')
                .setRequired(true))
        .addNumberOption(option =>  // Change from StringOption to NumberOption
            option.setName('price')
                .setDescription('Price in Indian rupees')
                .setRequired(true))
        .toJSON(),
    // new SlashCommandBuilder()
    //     .setName('update')
    //     .setDescription('Update')
    //     .addStringOption(option =>
    //         option.setName('id')
    //             .setDescription('Product id')
    //             .setRequired(true))
    //     .addStringOption(option =>
    //         option.setName('name')
    //             .setDescription('new of product'))
    //     .addStringOption(option =>
    //         option.setName('details')
    //             .setDescription('Details of product'))
    //     .toJSON(),
    new SlashCommandBuilder()
        .setName('new-page')
        .setDescription('Create a new page for you')
        .addStringOption(option =>
            option.setName('page-title')
                .setDescription('Enter product page title'))
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

async function refreshCommands() {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}

refreshCommands();
