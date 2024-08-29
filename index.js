require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectToMongoose = require('./db/db');
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');
const axios = require('axios');
const { createProduct } = require('./models/Product');
const ProductPage = require('./models/ProductPage');
const routes = require("./routes/index");

const { client_url } = require('./constant.jsx');
// const { client_url } = require('./constant');

// discord premision which are required has to mention here
// const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});


connectToMongoose(); // connect to mongo db
const app = express(); // init app
app.use(express.json());

const port = process.env.PORT || 8000;

const allowedOrigins = [
    'http://localhost:5173',
];

const corsOptions = {
    origin: function (origin, callback) {
        console.log('Origin:', origin); // Log the origin for debugging
        // Allow requests with no origin like mobile apps or curl requests
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS'); // Log blocked origins
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,POST',
    credentials: true
};

app.use(cors(corsOptions));

app.use('/v1/', routes);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

function generateUrlSlug(length = 15) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charactersLength);
        result += characters.charAt(randomIndex);
    }

    return result;
}


function isNumber(num) {
    if (/^\d+$/.test(num)) {
        return true;
    }
    return false;
}


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});


client.on('messageCreate', (message) => {
    // Check if the message has text content
    if (message.author.bot) return;

    if (message.content) {
        console.log('Text Message:', message);
    }

    // Check if the message has attachments
    if (message.attachments.size > 0) {
        // Loop through the attachments to check if they are images
        message.attachments.forEach(attachment => {
            if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                console.log('User sent an image:', attachment.url);
            }
        });
    }

    // // Handle cases where both text and image are present
    // if (message.content && message.attachments.size > 0) {
    //     console.log('User sent both text and an image.');
    // }


    message.reply({
        content: "Thanks...",
    })
});


const currentProduct = { name: '', details: '', image: [] };


// client.on('guildMemberAdd', async member => {
//     try {
//         console.log("NEW MEMBER")
//         const channelName = `${member.user.username}-channel`;

//         // Create a new text channel in the same category as the general channel
//         const generalChannel = member.guild.channels.cache.find(ch => ch.name === 'general');
//         const categoryID = generalChannel ? generalChannel.parentId : null;

//         const newChannel = await member.guild.channels.create(channelName, {
//             type: 'GUILD_TEXT',
//             parent: categoryID, // Place the channel under the same category as 'general'
//             permissionOverwrites: [
//                 {
//                     id: member.guild.id,
//                     deny: ['VIEW_CHANNEL'],
//                 },
//                 {
//                     id: member.id,
//                     allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
//                 },
//             ],
//         });

//         // Send a welcome message in the new channel
//         newChannel.send(`Welcome, ${member.user.username}! This is your private channel.`);
//     } catch (error) {
//         console.error('Error creating channel:', error);
//     }
// 
//  }
// );


client.on('guildMemberAdd', async (member) => {
    try {
        console.log("NEW MEMBER");
        let channelName = `${member.user.username}-channel`;

        // Sanitize the channel name
        channelName = channelName.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();

        // Check if a channel with the same name already exists
        const existingChannel = member.guild.channels.cache.find(
            (ch) => ch.name === channelName && ch.type === ChannelType.GuildText
        );

        if (existingChannel) {
            console.log(`Channel already exists for ${member.user.username}`);
            existingChannel.permissionOverwrites.edit(member.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
            });
            existingChannel.send(`Welcome back, ${member.user.username}! This is your private channel.`);
        } else {
            const generalChannel = member.guild.channels.cache.find(ch => ch.name === 'general');
            const categoryID = generalChannel ? generalChannel.parentId : null;

            const newChannel = await member.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: categoryID,
                permissionOverwrites: [
                    {
                        id: member.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: member.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                        ],
                    },
                ],
            });

            newChannel.send(`Welcome, ${member.user.username}! This is your private channel.`);
        }
    } catch (error) {
        console.error('Error managing channel:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'new-product') {
        try {
            const user_channel_name = interaction.channel.name;
            const name = interaction.options.getString('name');
            const details = interaction.options.getString('details');
            const price = interaction.options.getNumber('price');  // Use getNumber for price
            const userPage = await ProductPage.find({ username: user_channel_name });

            if (userPage.length == 0) {
                await interaction.reply({
                    content: `Your Page is not created yet. \n First create your page by messaging us with /new-page to create your page`,
                    ephemeral: true
                });
                return;
            }

            // No need for additional number checks as Discord will enforce the type
            // Defer the reply since we are doing further asynchronous operations
            await interaction.deferReply({ ephemeral: true });

            currentProduct.name = name;
            currentProduct.details = details;
            currentProduct.price = price;

            // Prompt the user to upload images
            await interaction.editReply({
                content: `Great, now upload an image`
            });

            // Create a filter for messages containing attachments from the specific user
            const filter = msg => msg.author.id === interaction.user.id && msg.attachments.size > 0;
            const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

            collector.on('collect', msg => {
                msg.attachments.forEach(attachment => {
                    if (attachment.url) {
                        currentProduct.image.push(attachment.url);
                        console.log(`Received image: ${attachment.url}`);
                    }
                });
                interaction.followUp('Images received!');
            });

            collector.on('end', async collected => {
                // Proceed with creating the product
                const newProduct = await createProduct({
                    name: currentProduct.name,
                    details: currentProduct.details,
                    price: price,
                    image: [...currentProduct.image]
                });

                // Optionally, clear the currentProduct for the next use
                currentProduct.name = '';
                currentProduct.details = '';
                currentProduct.image = [];

                // Add new product to user's page
                const existingProduct = userPage[0].product;
                existingProduct.push(newProduct._id);
                userPage[0].product = existingProduct;
                await userPage[0].save();

                interaction.followUp(`Your product has been successfully updated \n **Product Name:** ${newProduct.name} \n **Product Details:** ${newProduct.details} \n **Product id:** ${newProduct.productId}`);
            });

        } catch (error) {
            console.error("Error while handling interaction:", error);
            if (interaction.deferred || interaction.replied) {
                interaction.followUp(`There was a problem processing your request. Please try again later.`);
            } else {
                interaction.reply(`There was a problem processing your request. Please try again later.`);
            }
        }
    }



    if (interaction.commandName === "update") {
        const name = interaction.options.getString('name');
        // const datails = interaction.options.getString('name');
        const details = interaction.options.getString('details');

        const newProduct = await createProduct({
            name: currentProduct.name,
            details: currentProduct.details,
            image: [...currentProduct.image]
        });

        // Optionally, clear the currentProduct for the next use
        currentProduct.name = '';
        currentProduct.details = '';
        currentProduct.image = [];

        // console.log('Product created:', newProduct);
        interaction.followUp(`Your product is successfull updated \n **Product Name:** ${newProduct.name} \n **Product Details:** ${newProduct.details} \n **Product id:** ${newProduct.productId}`);

    }

    if (interaction.commandName === "new-page") {
        try {
            const user_channel_name = interaction.channel.name;
            // console.log(user_channel_name)
            if (user_channel_name === "general" && interaction.user.username !== "kunalagrawal6843") {
                await interaction.reply({
                    content: `I already created a new private channel of your name \n Please message in that to maintain privacy`
                })
                return;
            } else {
                // interaction.followUp(`Thanks for using us. \n This might take few second`);
                await interaction.reply({
                    content: `Thanks for using us. \n This might take few second`
                })
            }

            const isUerPageAlreadyExist = await ProductPage.find({ username: user_channel_name })
            // console.log(isUerPageAlreadyExist);
            if (isUerPageAlreadyExist.length != 0) {
                interaction.followUp(`Your Page already exist. \n Your Page - ${client_url}/${isUerPageAlreadyExist[0].slug}`);
                return;
            }

            const page_title = interaction.options.getString('page-title');

            const urlSlug = generateUrlSlug();

            await ProductPage.create({
                slug: urlSlug,
                username: user_channel_name,
                pageTitle: `${page_title || user_channel_name} - Product Page`,
                product: [],
            })

            interaction.followUp(`Your page is ready \n Your Page - ${client_url}/${urlSlug}`);
        } catch (error) {
            interaction.followUp(`There might some problem now. Try later`)
        }
    }
});

client.login(process.env.TOKEN);