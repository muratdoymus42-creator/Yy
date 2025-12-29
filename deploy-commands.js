// deploy-commands.js (GÜNCELLENMİŞ TICKET VE AYAR KOMUTLARI)

require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    console.error("HATA: DISCORD_TOKEN veya CLIENT_ID (.env dosyası) eksik.");
        process.exit(1);
        }

        const commands = [
            {
                    name: 'ticket',
                            description: 'Destek panelini gönderir (Sadece Yönetici/Sahip).',
                                },
                                    {
                                            name: 'ticket-ayar',
                                                    description: 'Destek sistemi ayarlarını (Rol ve Kategori) yapar.',
                                                            options: [
                                                                        {
                                                                                        name: 'tur',
                                                                                                        description: 'Ayarlamak istediğiniz bileşen.',
                                                                                                                        type: ApplicationCommandOptionType.String,
                                                                                                                                        required: true,
                                                                                                                                                        choices: [
                                                                                                                                                                            { name: 'Destek Kategori ID', value: 'category_id' },
                                                                                                                                                                                                { name: 'Destek Ekibi Rol ID', value: 'support_role' },
                                                                                                                                                                                                                ],
                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                        {
                                                                                                                                                                                                                                                        name: 'deger',
                                                                                                                                                                                                                                                                        description: 'Yeni Kategori ID (Metin) veya Rol (Bahsetme)',
                                                                                                                                                                                                                                                                                        type: ApplicationCommandOptionType.String, 
                                                                                                                                                                                                                                                                                                        required: true,
                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                            ],
                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                ];

                                                                                                                                                                                                                                                                                                                                const rest = new REST({ version: '10' }).setToken(token);

                                                                                                                                                                                                                                                                                                                                (async () => {
                                                                                                                                                                                                                                                                                                                                    try {
                                                                                                                                                                                                                                                                                                                                            console.log(`[REST] ${commands.length} adet komut yenileniyor.`); 

                                                                                                                                                                                                                                                                                                                                                    const data = await rest.put(
                                                                                                                                                                                                                                                                                                                                                                Routes.applicationCommands(clientId),
                                                                                                                                                                                                                                                                                                                                                                            { body: commands },
                                                                                                                                                                                                                                                                                                                                                                                    );

                                                                                                                                                                                                                                                                                                                                                                                            console.log(`[REST] ${data.length} adet komut başarıyla yüklendi.`);
                                                                                                                                                                                                                                                                                                                                                                                                } catch (error) {
                                                                                                                                                                                                                                                                                                                                                                                                        console.error("[REST HATA] Komutları yüklerken hata oluştu:", error);
                                                                                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                                                                                            })();