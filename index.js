// index.js (AYARLARI KOMUT İLE YÖNETEN TICKET SİSTEMİ)

require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    Events, 
    EmbedBuilder,
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType, 
    PermissionsBitField 
} = require('discord.js');
const db = require('./db'); // Veritabanı import'u

// Sabitler
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
 

// Veritabanı anahtarları
const TICKET_CATEGORY_ID_KEY = 'ticket_category_id';
const SUPPORT_ROLE_ID_KEY = 'support_role_id';

// Client tanımı
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMessages,
    ] 
});

// -------------------- BOT OLAYLARI --------------------

client.once(Events.ClientReady, async readyClient => {
    // Veritabanı tablolarını oluştur
    await db.createTable(); 
    console.log(`Bot Ready! Logged in as ${readyClient.user.tag}`);
});


// -------------------- KOMUT VE BUTON İŞLEME --------------------

client.on(Events.InteractionCreate, async interaction => {
    
    if (interaction.isChatInputCommand()) {
        
        // Sadece sahip komutları kullanabilir
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: 'Bu komutu kullanma yetkiniz yok.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        // ------------ A. TICKET AYAR KOMUTU ------------
        if (interaction.commandName === 'ticket-ayar') {
            const tur = interaction.options.getString('tur');
            let deger = interaction.options.getString('deger').trim();
            let keyToUse = null;
            let successMessage = '';
            
            // Rol/Kategori ID'sini metin veya bahsetme formatından temizle
            const idMatch = deger.match(/<@&?(\d+)>|(\d+)/);
            if (idMatch) {
                deger = idMatch[1] || idMatch[2];
            }
            if (!/^\d+$/.test(deger)) {
                 return interaction.editReply({ content: '❌ Girilen değer geçerli bir ID formatında değil (sadece sayılar). Bahsetme veya ID girin.' });
            }

            if (tur === 'category_id') {
                keyToUse = TICKET_CATEGORY_ID_KEY;
                successMessage = `✅ Destek Kategori ID'si başarıyla **${deger}** olarak ayarlandı.`;
            } else if (tur === 'support_role') {
                keyToUse = SUPPORT_ROLE_ID_KEY;
                successMessage = `✅ Destek Ekibi Rol ID'si başarıyla **${deger}** olarak ayarlandı.`;
            } else {
                 return interaction.editReply({ content: '❌ Geçersiz ayar türü belirtildi.' });
            }

            const result = await db.setSetting(keyToUse, deger);

            if (result.success) {
                interaction.editReply({ content: successMessage });
            } else {
                interaction.editReply({ content: `❌ Ayar kaydedilirken veritabanı hatası oluştu: ${result.message}` });
            }

        // ------------ B. TICKET PANEL KOMUTU ------------
        } else if (interaction.commandName === 'ticket') {
            
            try {
                const panelButton = new ButtonBuilder()
                    .setCustomId('open_ticket')
                    .setLabel('Yeni Destek Bileti Aç')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫');
                
                const row = new ActionRowBuilder().addComponents(panelButton);
    
                await interaction.channel.send({
                    content: '**Discord Destek Sistemi**\nAşağıdaki butona tıklayarak yeni bir destek bileti açabilirsiniz.',
                    components: [row],
                });
    
                interaction.editReply({ content: 'Ticket paneli başarıyla gönderildi.', ephemeral: true });
    
            } catch (error) {
                console.error("Ticket Panel Komutunda Hata:", error);
                interaction.editReply({ content: '❌ Ticket panelini oluştururken kritik bir hata oluştu.' });
            }
        }
    } 
    
    // -------------------- BUTON ETKİLEŞİMLERİ --------------------

    if (interaction.isButton()) {
        
        const TICKET_CATEGORY_ID = await db.getSetting(TICKET_CATEGORY_ID_KEY);
        const SUPPORT_ROLE_ID = await db.getSetting(SUPPORT_ROLE_ID_KEY);

        if (!TICKET_CATEGORY_ID || !SUPPORT_ROLE_ID) {
            return interaction.reply({ content: '❌ Destek sistemi ayarları yapılmamış. Lütfen `/ticket-ayar` komutunu kullanın.', ephemeral: true });
        }


        if (interaction.customId === 'open_ticket') {
            
            await interaction.deferReply({ ephemeral: true });
            
            try {
                const guild = interaction.guild;
                const user = interaction.user;
                
                // Basit kontrol: Kullanıcının kategori içinde açık bileti var mı?
                const existingChannel = guild.channels.cache.find(
                    c => c.type === ChannelType.GuildText && c.parent === TICKET_CATEGORY_ID && c.topic && c.topic.includes(`user_id:${user.id}`)
                );
    
                if (existingChannel) {
                     return interaction.editReply({ content: `⚠️ Zaten açık bir biletiniz var: ${existingChannel}`, ephemeral: true });
                }
                
                const channelName = `destek-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`.substring(0, 100);
    
                // 1. Yeni Kanal Oluşturma
                const channel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: TICKET_CATEGORY_ID, // DB'den gelen ID
                    topic: `user_id:${user.id}`, 
                    permissionOverwrites: [
                        // Kullanıcıya izin ver
                        {
                            id: user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
                        },
                        // Herkesten gizle
                        {
                            id: guild.roles.everyone,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        // Destek ekibine erişim izni ver (DB'den gelen ID)
                        {
                            id: SUPPORT_ROLE_ID,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                        },
                    ],
                });
    
                // 2. Kapatma Butonu Oluşturma
                const closeButton = new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Bileti Kapat')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒');
    
                const row = new ActionRowBuilder().addComponents(closeButton);
    
                // 3. Kanala Hoş Geldiniz Mesajı Gönderme
                channel.send({
                    content: `<@${user.id}>, <@&${SUPPORT_ROLE_ID}> ekibiyle iletişime geçildi.`,
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('🎫 Yeni Destek Bileti Açıldı')
                            .setDescription('Lütfen sorununuzu detaylıca açıklayın ve gerekli ekran görüntülerini paylaşın.')
                            .addFields(
                                { name: 'Bilet Sahibi', value: `<@${user.id}>`, inline: true },
                                { name: 'ID', value: `${user.id}`, inline: true },
                            )
                            .setColor('#0099ff')
                    ],
                    components: [row]
                });
    
                interaction.editReply({ content: `✅ Destek biletiniz ${channel} kanalında açıldı.`, ephemeral: true });
    
            } catch (error) {
                console.error("Ticket Açma Hatası:", error);
                interaction.editReply({ content: `❌ Bilet açılırken kritik bir hata oluştu. Ayarlarınızı kontrol edin.`, ephemeral: true });
            }

        } else if (interaction.customId === 'close_ticket') {
            
            const member = interaction.member;
            
            // Kanal konusundan bilet sahibini çek
            const channelTopic = interaction.channel.topic || '';
            const ticketOwnerIdMatch = channelTopic.match(/user_id:(\d+)/);
            const ticketOwnerId = ticketOwnerIdMatch ? ticketOwnerIdMatch[1] : null;

            // Kontrol: Destek rolü, bilet sahibi veya bot sahibi
            const isSupportStaff = member.roles.cache.has(SUPPORT_ROLE_ID);
            const isTicketOwner = member.id === ticketOwnerId;
            
            if (!isSupportStaff && !isTicketOwner && member.id !== OWNER_ID) {
                 return interaction.reply({ content: 'Bu bileti kapatma yetkiniz yok.', ephemeral: true });
            }

            await interaction.deferReply();
            
            // Kapatma işlemi
            try {
                const closeEmbed = new EmbedBuilder()
                    .setDescription(`🔒 Bilet ${member} tarafından kapatılıyor... Kanal 10 saniye içinde silinecektir.`)
                    .setColor(ButtonStyle.Danger);

                await interaction.channel.send({ embeds: [closeEmbed] });
                
                setTimeout(async () => {
                    await interaction.channel.delete('Ticket kapatıldı.').catch(err => {
                        console.error("Kanal silme hatası:", err);
                    });
                }, 10000); 

            } catch (error) {
                console.error("Ticket Kapatma Hatası:", error);
                interaction.editReply({ content: '❌ Bileti kapatırken kritik bir hata oluştu.' });
            }
        }
    }
});

client.login(DISCORD_TOKEN);

