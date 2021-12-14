const { GraphQLClient } = require('graphql-request')
const { Markup, Scenes, session, Telegraf } = require('telegraf')
const config = require('./config')
const db = require('./db')
const secrets = require('./secrets')
const queries = require('./queries')

const bot = new Telegraf(secrets.bot.token)

var si_donations;
var si_offers;

// object to handle offers timeouts and reminders
var timeouts = {}
var reminders = {}
// object to handle current donation
var curDonation = {}
// object to handle current sorted resource
var curSorting = {}
// keep track of current donation number
var numDonation = 0
// keep track of current offer number
var numOffer = 0

const client = new GraphQLClient(config.reflow.api_url)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* Define all Wizards */

/*
- Actions
    Donation : From Wholesaler to RECUP
    Sorting  : From RECUP to RECUP
    Offer    : From RECUP to Associations
    Transfer : From RECUP to Associations
*/

const donationWizard = new Scenes.WizardScene('donation-wizard', async (ctx) => {
    await sleep(Math.floor(Math.random() * 500));
    ctx.replyWithMarkdown('*Donazione*\nChe prodotto ti è stato donato?');
    ctx.wizard.state.donation = {};
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || ctx.message.text.length <= 2) {
      ctx.reply('Non ho capito, riprova.');
      return; 
    }
    ctx.wizard.state.donation.name = ctx.message.text;
    await sleep(Math.floor(Math.random() * 500));
    ctx.reply('Quanti colli sono stati donati?');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (isNaN(ctx.message.text)) {
      ctx.reply('Perfavore inserisci un numero.');
      return; 
    }    
    ctx.wizard.state.donation.quantity = parseFloat(ctx.message.text);
    await sleep(Math.floor(Math.random() * 500));
    ctx.reply('Chi li ha donati? Inserisci il codice fornitore')

    return ctx.wizard.next();
  },  
  async (ctx) => {

    if (!(/^([a-zA-Z][0-9]+)$/.test(ctx.message.text))) {
      ctx.reply('Perfavore inserisci un codice fornitore valido (es. A24).');
      return; 
    }
    
    provider = db.getProviderByKey(ctx.message.text.toUpperCase())

    if (!provider.length){
      ctx.reply('Non conosco questo codice fornitore. Riprova.');
      return;         
    }

    ctx.wizard.state.donation.provider = provider[0].name;
    
    await sleep(Math.floor(Math.random() * 500));
    
    curDonation = ctx.wizard.state.donation

    message = '🍌 *Riepilogo donazione*'
    message += '\n*Prodotto* ' + curDonation.name
    message += '\n*Quantità* ' + curDonation.quantity + ' colli'
    message += '\n*Donatore* ' + provider[0].name + ' (' + provider[0].key + ')'

    ctx.replyWithMarkdown(message,
        Markup.inlineKeyboard([
        Markup.button.callback('✔️ Salva', `recordDonation`),
        Markup.button.callback('✏️ Modifica', `newDonation`),
        Markup.button.callback('❌ Annulla', `startMenu`),        
    ]))

    return ctx.scene.leave();
  },
);

const sortingWizard = new Scenes.WizardScene('sorting-wizard', (ctx) => {
    ctx.replyWithMarkdown('*Selezione*\nQuale prodotto hai smistato?');

    // TODO - GraphQL Get inventory (?)

    ctx.wizard.state.sorting = {};
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || ctx.message.text.length <= 2) {
      ctx.reply('Non ho capito, riprova.');
      return; 
    }
    ctx.wizard.state.sorting.name = ctx.message.text;
    
    await sleep(Math.floor(Math.random() * 500));
    ctx.reply('Quale era il peso iniziale? (in kg)');
    
    return ctx.wizard.next();
  },
   async (ctx) => {
    if (isNaN(ctx.message.text)) {
      ctx.reply('Perfavore inserisci un numero.');
      return; 
    }

    ctx.wizard.state.sorting.start_quantity = parseFloat(ctx.message.text);
    
    await sleep(Math.floor(Math.random() * 500));
    ctx.reply('Quale è il peso finale? (in kg)')

    return ctx.wizard.next();
  },
   async (ctx) => {
    if (isNaN(ctx.message.text)) {
      ctx.reply('Perfavore inserisci un numero.');
      return; 
    }
    
    if (ctx.message.text > ctx.wizard.state.sorting.start_quantity){
      ctx.reply('Il peso finale non può essere maggiore di quello iniziale.');
      return;         
    }

    if (parseFloat(ctx.message.text) <= 0){
      ctx.reply('Il peso finale non può essere negativo.');
      return;         
    }

    ctx.wizard.state.sorting.end_quantity = parseFloat(ctx.message.text);

    await sleep(Math.floor(Math.random() * 500));
    ctx.reply('Hai note da aggiungere?')

    return ctx.wizard.next();
  },
   async (ctx) => {

    if (ctx.message.text.toLowerCase() == "no") {
        ctx.wizard.state.sorting.notes = ""
        await ctx.reply('Ok');
    } else {
        ctx.wizard.state.sorting.notes = ctx.message.text;
    }

    curSorting = ctx.wizard.state.sorting;

    var message = '🍌 *Riepilogo selezione*'
    message += '\nRecuperati ' + curSorting.end_quantity + ' kg di ' + curSorting.name + ' su ' + curSorting.start_quantity +' kg iniziali.'
    
    if (curSorting.notes.length > 0)
        message += '\nNote: ' + curSorting.notes

    ctx.replyWithMarkdown(message,
        Markup.inlineKeyboard([
        Markup.button.callback('✔️ Salva', `recordSorting`),
        Markup.button.callback('✏️ Modifica', `newSorting`),
        Markup.button.callback('❌ Annulla', `startMenu`),        
    ]))

    return ctx.scene.leave();
  },
);

const offerWizard = new Scenes.WizardScene('offer-wizard', async (ctx) => {
    
    if (Object.keys(curSorting).length > 0) {

        var message = '🍌 *Riepilogo donazione*'
        message += '\n*Prodotto:* ' + curSorting.name
        message += '\n*Quantità:* ' + curSorting.end_quantity + ' kg'
    
        if (curSorting.notes.length > 0)
            message += '\n- Note: ' + curSorting.notes

        var r_id = db.getCRI()[0].reflow_id
        var u_id = db.getUnitByLabel('kg')[0].reflow_id    
        var quantity = {hasUnit: u_id, hasNumericalValue: curSorting.end_quantity}

        var res = await client.request(queries.recordOffer, {receiver_id: r_id, resource_id: curSorting.resource_id, quantity: quantity})

        console.log("> New offer created!")

        console.log(res)

        ctx.replyWithMarkdown(message).then(() =>
            ctx.reply('Grazie, donazione inviata!').then(async () =>
             {await sleep(2000); startMenu(ctx)}));
        
        curSorting = {}

        return ctx.scene.leave();

    } else {
        var agent_id = db.getRECUP()[0].reflow_id
        var tag_id = db.getTagFromLabel('sorted')[0].reflow_id

        var res = await client.request(queries.getFilteredInventory, {agent: agent_id, tag: tag_id})

        var btns = []

        res.economicResourcesFiltered.forEach(r => {
            console.log(r)

            var name = r.name
            var qty = r.onhandQuantity.hasNumericalValue
            var unit = r.onhandQuantity.hasUnit.symbol
            var notes = r.note

            if (qty > 0) {
                var btn_text = name + ' / ' + qty + ' ' + unit
                if (notes)
                    btn_text += ' / ' + notes

                btns.push([Markup.button.callback(btn_text, `recordOffer ${r.id}-${qty}`)])
            }
        })

        if (btns.length == 0) {
            ctx.reply('Tutti i prodotti sono stati già offerti! 🎉')        
        } else {
            btns.push([Markup.button.callback('Annulla', `startMenu`)])
            ctx.replyWithMarkdown('*Ridistribuzione*\nQuale prodotto vuoi ridistribuire?', Markup.inlineKeyboard(btns));
        }
        return ctx.scene.leave();
    }
  },
);

const transferWizard = new Scenes.WizardScene('transfer-wizard', async (ctx) => {
        
    var agent_id = db.getRECUP()[0].reflow_id

    var res = await client.request(queries.getSatisfactions)

    res = queries.filterSatisfactions(res.satisfactions, agent_id, false)

    var btns = []

    res.forEach(r => {
        console.log(r)

        var name = r.satisfies.resourceInventoriedAs.name
        var who = db.getUserFromRFid(r.satisfiedBy.provider.id)[0].name
        var qty = r.resourceQuantity.hasNumericalValue
        var unit = r.resourceQuantity.hasUnit.symbol

        if (qty > 0) {
            var btn_text = who + ' / ' + name + ' / ' + qty + ' ' + unit

            btns.push([Markup.button.callback(btn_text, `recordTransfer ${r.id}`)])
        }
    })

    if (btns.length == 0) {
        ctx.reply('Tutte le donazioni sono state ritirate! 🎉')        
    } else {
        btns.push([Markup.button.callback('Annulla', `startMenu`)])
        ctx.replyWithMarkdown('*Ritiro*\nQuale delle seguenti donazioni è stata ritirata?', Markup.inlineKeyboard(btns));
    }
    return ctx.scene.leave();
});

const stage = new Scenes.Stage([donationWizard, sortingWizard, offerWizard, transferWizard]);
bot.use(session());
bot.use(stage.middleware());

bot.action('startMenu', (ctx) => {
    curDonation = {}
    curSorting = {}
    ctx.editMessageReplyMarkup({ inline_keyboard: null }, { chat_id: ctx.callbackQuery.message.chat.id, message_id: ctx.callbackQuery.message.message_id });    
    startMenu(ctx);
});

bot.action('newOffer', (ctx) => {
    ctx.editMessageReplyMarkup({ inline_keyboard: null }, { chat_id: ctx.callbackQuery.message.chat.id, message_id: ctx.callbackQuery.message.message_id });    
    ctx.scene.enter('offer-wizard')
})

bot.action('newDonation', (ctx) => {
    ctx.editMessageReplyMarkup({ inline_keyboard: null }, { chat_id: ctx.callbackQuery.message.chat.id, message_id: ctx.callbackQuery.message.message_id });    
    ctx.scene.enter('donation-wizard')
})

bot.action('newSorting', (ctx) => {
    ctx.editMessageReplyMarkup({ inline_keyboard: null }, { chat_id: ctx.callbackQuery.message.chat.id, message_id: ctx.callbackQuery.message.message_id });    
    ctx.scene.enter('sorting-wizard')
})

bot.action('recordSorting', async (ctx) => {

    if (Object.keys(curSorting).length > 0){

        var p_id = db.getRECUP()[0].reflow_id
        var u_id = db.getUnitByLabel('kg')[0].reflow_id
        var init_qnt = {hasUnit: u_id, hasNumericalValue: curSorting.start_quantity}
        var tag = db.getTagFromLabel('sorted')[0].reflow_id
        var notes = curSorting.notes

        var res = await client.request(queries.recordActionNewResource, {action: "produce", provider_id: p_id, receiver_id: p_id, quantity: init_qnt, product_name: curSorting.name, tags: tag, notes: notes})

        console.log("> Produce done.")
        
        curSorting.resource_id = res.createEconomicEvent.economicEvent.resourceInventoriedAs.id

        var consume_qnt = {hasUnit: u_id, hasNumericalValue: curSorting.start_quantity - curSorting.end_quantity}

        var res = await client.request(queries.recordAction, {action:"consume", provider_id: p_id, quantity: consume_qnt, resource_id: curSorting.resource_id})

        console.log("> Consume done.")

        console.log(res)

        ctx.reply('Grazie, selezione registrata!').then(async () => {
            console.log(curSorting);
            await sleep(1500)
            ctx.replyWithMarkdown("Vuoi distribuirlo subito?",
                Markup.inlineKeyboard([
                Markup.button.callback('👍 Si', `newOffer`),
                Markup.button.callback('👎 No', `startMenu`)
            ]))
        });
    }
})

bot.action('recordDonation', async (ctx) => {
    ctx.editMessageReplyMarkup({ inline_keyboard: null }, { chat_id: ctx.callbackQuery.message.chat.id, message_id: ctx.callbackQuery.message.message_id });    
    
    if (Object.keys(curDonation).length > 0){
        console.log('> Saving donation:')
        console.log(curDonation);

        var p_id = db.getProviderByName(curDonation.provider)[0].reflow_id
        var r_id = db.getRECUP()[0].reflow_id
        var u_id = db.getUnitByLabel('colli')[0].reflow_id
        var quantity = {hasUnit: u_id, hasNumericalValue: curDonation.quantity}

        var res = await client.request(queries.recordActionNewResource, {action: "transfer", provider_id: p_id, receiver_id: r_id, quantity: quantity, product_name: curDonation.name})

        console.log(res)

        ctx.reply('Grazie, donazione registrata!').then(async () => {await sleep(2000); startMenu(ctx)})
        curDonation = {}
    }
});

function stopDonationTimer(donationID) {
    // stop timer for this donation
    clearTimeout(timeouts[donationID])
    delete timeouts[donationID]
    clearInterval(reminders[donationID])
    delete reminders[donationID]
    console.log("> Cancel timer "+ donationID)
}

function autoRefuseDonation(msg, donationID){
    // update the content of the message
    let new_msg = msg.text.substring(0, msg.text.length-66)
    new_msg += '⏰ *Tempo scaduto* Donazione rifiutata automaticamente.'

    bot.telegram.editMessageText(msg.chat.id, msg.message_id, undefined, new_msg, {parse_mode: 'Markdown'})    
    refuseDonation(donationID)
}

function sendReminder(msg){
    bot.telegram.sendMessage(msg.chat.id, "⌛ Ricorda di rispondere all'offerta prima della scadenza!", {reply_to_message_id : msg.message_id})
}

function refuseDonation(donationID) {
    stopDonationTimer(donationID)

    console.log(donationID)

    client.request(queries.getIntent, {intent_id: donationID}).then((res) => {

        console.log(res)
        var unit = res.intent.availableQuantity.hasUnit.id

        client.request(queries.createCommitment, {provider_id: db.getRECUP()[0].reflow_id , receiver_id: res.intent.provider.id}).then((res) => {

            let quantity = {hasUnit: unit, hasNumericalValue: 0}

            client.request(queries.createSatisfaction, {intent_id: donationID, commitment_id: res.createCommitment.commitment.id, quantity: quantity}).then((res) => {

                console.log("> Donation refused!")

                console.log(res)

            })
        })
    })
}

function acceptDonation(donationID) {
    stopDonationTimer(donationID)

    console.log(donationID)

    client.request(queries.getIntent, {intent_id: donationID}).then((res) => {

        console.log(res)
        var unit = res.intent.availableQuantity.hasUnit.id
        var qty = res.intent.availableQuantity.hasNumericalValue

        client.request(queries.createCommitment, {provider_id: db.getRECUP()[0].reflow_id , receiver_id: res.intent.provider.id}).then((res) => {

            let quantity = {hasUnit: unit, hasNumericalValue: qty}

            client.request(queries.createSatisfaction, {intent_id: donationID, commitment_id: res.createCommitment.commitment.id, quantity: quantity}).then((res) => {

                console.log("> Donation accepted!")

                console.log(res)

            })
        })
    })
}

function acceptOffer(offerID, qty) {

    console.log(offerID)

    client.request(queries.getIntent, {intent_id: offerID}).then((res) => {

        console.log(res)
        var unit = res.intent.availableQuantity.hasUnit.id

        client.request(queries.createCommitment, {provider_id: db.getCRI()[0].reflow_id , receiver_id: res.intent.provider.id}).then((res) => {

            let quantity = {hasUnit: unit, hasNumericalValue: qty}

            client.request(queries.createSatisfaction, {intent_id: offerID, commitment_id: res.createCommitment.commitment.id, quantity: quantity}).then((res) => {

                console.log("> Offer accepted!")

                console.log(res)

            })
        })
    })
}

/* Parse and format GraphQL response to Telegram message */
async function parseDonations(ctx, data) {
    for (const x of data) {
        
        // consider only donations without response        
        if (x.satisfiedBy.length == 0) {

            message = '🍌 *C\'è merce per te\!*\n'

            if (x.provider) {
                let id = x.provider.id
                let provider = db.getProviderByRFid(id)[0]
                
                if (provider) {
                    message += '- Donatore: ' + provider.name + ' ('+ provider.key +')';
                } else {
                    continue;
                }
            }
            
            if (x.availableQuantity){
                message += '\n- Quantità: ' + x.availableQuantity.hasNumericalValue
                message += ' ' + x.availableQuantity.hasUnit.symbol
            } else {
                continue;
            }

            if (x.note)
                message += '\n- Stato: ' + x.note

            message += "\n\n⚠️ Ricordati di rispondere entro *" + config.bot.donation_timeout/60000+ " minuti*."

            message += "\n\nAccetti la donazione?"
            await ctx.replyWithMarkdown(message,
                Markup.inlineKeyboard([
                Markup.button.callback('👍 Si', `acceptDonation ${x.id}`),
                Markup.button.callback('👎 No', `refuseDonation ${x.id}`),
            ])).then((msg) => {
                console.log("> Set new timer "+ x.id)
                timeouts[x.id] = setTimeout(autoRefuseDonation, config.bot.donation_timeout, msg, x.id);
                console.log(msg)
                reminders[x.id] = setInterval(sendReminder, config.bot.reminder_timeout, msg);
            })
        } else {
            continue
        }
    }
}

async function parseOffers(ctx, data) {
    for (const x of data) {
        console.log(x)
        // consider only offers without response        
        if (x.satisfiedBy.length == 0) {

            message = '📦 *Nuova donazione*'
            
            if (x.resourceInventoriedAs) {
                var res = x.resourceInventoriedAs

                if (res.onhandQuantity.hasNumericalValue > 0) {

                    message += '\nSono disponibili per il ritiro ' + res.onhandQuantity.hasNumericalValue
                    message += ' ' + res.onhandQuantity.hasUnit.symbol
                    message += ' di ' + res.name +'.'
                } else {
                    continue;
                }
            } else {
                continue;
            }

            if (res.note)
                message += '\nNote: ' + res.note

            message += "\n\nQuanto puoi ritirare?"

            let qty = res.onhandQuantity.hasNumericalValue
            await ctx.replyWithMarkdown(message,
                Markup.inlineKeyboard([
                Markup.button.callback('🤏 ' + Math.floor(qty*0.25), `acceptOffer ${x.id}-${Math.floor(qty*0.25)}`),
                Markup.button.callback('☝️ ' + Math.floor(qty*0.5), `acceptOffer ${x.id}-${Math.floor(qty*0.5)}`),
                Markup.button.callback('✌️ ' + Math.floor(qty*0.75), `acceptOffer ${x.id}-${Math.floor(qty*0.75)}`),
                Markup.button.callback('🤘 ' + qty, `acceptOffer ${x.id}-${qty}`),
            ]))
        } else {
            continue
        }
    }
}

bot.action(/acceptOffer (.+)/, (ctx, next) => {

    // get offerID to accept
    let offerId = ctx.match[1].split('-')[0]

    // get accepted quantity
    let qty = parseFloat(ctx.match[1].split('-')[1])

    // get old message text
    let msg = ctx.update.callback_query.message.text
    // update the content of the message
    let new_msg = msg.substring(0, msg.length-21)
    new_msg += '👍 *Accettati ' + qty +' kg da '+ ctx.from.first_name + '*'

    return ctx.editMessageText(new_msg, {parse_mode: 'Markdown'}).then(() => acceptOffer(offerId, qty))
})

bot.action(/recordOffer (.+)/, async (ctx, next) => {
    // get resourceID to offer
    let res_id = ctx.match[1].split('-')[0]

    // get offered quantity
    let qty = parseFloat(ctx.match[1].split('-')[1])
    var u_id = db.getUnitByLabel('kg')[0].reflow_id    
    
    var quantity = {hasUnit: u_id, hasNumericalValue: qty}

    let r_id = db.getCRI()[0].reflow_id

    var res = await client.request(queries.recordOffer, {receiver_id: r_id, resource_id: res_id, quantity: quantity})

    console.log("> New offer created!")

    console.log(res)

    return ctx.reply('Grazie, donazione inviata!').then(async () => {await sleep(2000); startMenu(ctx)});
})

bot.action(/acceptDonation (.+)/, (ctx, next) => {
    // get donationID to accept
    let donationID = ctx.match[1]
    // get old message text
    let msg = ctx.update.callback_query.message.text
    // update the content of the message
    let new_msg = msg.substring(0, msg.length-66)
    new_msg += '👍 *Donazione accettata da '+ ctx.from.first_name + '*'

    return ctx.editMessageText(new_msg, {parse_mode: 'Markdown'}).then(() => acceptDonation(donationID))
})

bot.action(/refuseDonation (.+)/, (ctx, next) => {
    // get donationID to refuse
    let donationID = ctx.match[1]    
    // get old message text
    var msg = ctx.update.callback_query.message.text
    // update the content of the message
    var new_msg = msg.substring(0, msg.length-66)
    new_msg += '👎 *Donazione rifiutata da '+ ctx.from.first_name + '*'

    return ctx.editMessageText(new_msg, {parse_mode: 'Markdown'}).then(() => refuseDonation(donationID))
})

bot.action(/recordTransfer (.+)/, async (ctx, next) => {

    // get satifactionId to transfer
    let s_id = ctx.match[1]

    var res = await client.request(queries.getSatisfaction, {s_id: s_id})

    // get provider id
    var p_id = res.satisfaction.satisfiedBy.receiver.id

    // get receiver id
    var r_id = res.satisfaction.satisfiedBy.provider.id

    // get resource id
    var res_id = res.satisfaction.satisfies.resourceInventoriedAs.id

    // get intent id
    var i_id = res.satisfaction.satisfies.id

    // get accepted quantity
    var qty = res.satisfaction.resourceQuantity.hasNumericalValue

    // get accepted unit
    var u_id = res.satisfaction.resourceQuantity.hasUnit.id

    var quantity = {hasUnit: u_id, hasNumericalValue: qty}

    console.log('> Saving transfer')

    var res = await client.request(queries.recordAction, {action: "transfer", provider_id: p_id, receiver_id: r_id, quantity: quantity, resource_id: res_id})

    var res = await client.request(queries.finishIntent, {intent_id: i_id})

    ctx.reply('Grazie, trasferimento registrato!').then(async () => {await sleep(2000); startMenu(ctx)})

})

// Debug only : make a request to get all donations
bot.command('now', async ctx => {
    console.log(String(ctx.from.id))

    // check if sender is admin
    if (db.isAdminFromTGid(ctx.from.id)){
        
        // GraphQL - request all Intents made for a specific Agent and without Satisfaction
        var res = await client.request(queries.getIntents, {receiver_id: db.getRECUP()[0].reflow_id})
            
        if (res.intents.length > 0){
            // return all intents to Telegram
            parseDonations(ctx, res.intents)
        }
    }
})

bot.on('callback_query', function(ctx){
    const menu_item = ctx.update.callback_query.data;
    
    if (db.isAdminFromTGid(ctx.from.id)) {
        switch(menu_item) {
            case 'menu_donation' : return ctx.scene.enter('donation-wizard'); break;
            case 'menu_sorting'  : return ctx.scene.enter('sorting-wizard'); break;
            case 'menu_offer'    : return ctx.scene.enter('offer-wizard'); break;
            case 'menu_transfer' : return ctx.scene.enter('transfer-wizard'); break;
        }
    }
});

function getDonations(ctx) {

    // GraphQL - request all new Intents made for a specific Agent
    // TODO : update with DateTime filter
    client.request(queries.getIntents, {receiver_id: db.getRECUP()[0].reflow_id, num: 500}).then((res) => {
    
        console.log("> Current donations #" + res.intents.length)

        let newDonations = res.intents.length - numDonation

        if (newDonations > 0) {

            numDonation = res.intents.length

            // return all intents to Telegram
            parseDonations(ctx, res.intents.slice(0,newDonations))
        
        }  else {
            console.log("> No new donations.")
        }
    })
}

function getOffers(ctx) {

    // GraphQL - request all new Intents made for a specific Agent
    // TODO : update with DateTime filter
    client.request(queries.getIntents, {receiver_id: db.getCRI()[0].reflow_id, num: 500}).then((res) => {

        console.log("> Current offers #" + res.intents.length)

        let newOffers = res.intents.length - numOffer

        if (newOffers > 0) {

            numOffer = res.intents.length
    
            // return all intents to Telegram
            parseOffers(ctx, res.intents.slice(0,newOffers))

        }  else {
            console.log("> No new offers.")
        }
    })
}

function startMenu(ctx) {
    ctx.replyWithMarkdown('🍌 Ciao, cosa vuoi registrare?', {
       'reply_markup': {
           'inline_keyboard': [[{
                text: '1. Donazione',
                callback_data: 'menu_donation'
            }],[{
                text: '2. Selezione',
                callback_data: 'menu_sorting'
            }],[{
                text: '3. Ridistribuzione', 
                callback_data: 'menu_offer'
            }],[{
                text: '4. Ritiro',
                callback_data: 'menu_transfer'
            }]]
        }
    })
}

function startNotifications(ctx, group_name) {
    
    ctx.replyWithMarkdown('🍌 *BOTTO avviato!*\nRiceverai aggiornamenti sulle donazioni ogni ' + config.bot.polling_time/1000 + ' secondi.')

    if (group_name == "IN") {

        si_donations = setInterval(() => { getDonations(ctx) } , config.bot.polling_time)
    
    } else if (group_name == "OUT") {

        si_offers = setInterval(() => { getOffers(ctx) }, config.bot.polling_time)
    }
}

async function createSession() {
    var session = await client.request(queries.login, {username: secrets.reflow.username, password: secrets.reflow.password})
    console.log("> Login...")
    console.log(session)
    client.setHeader('authorization', 'Bearer ' + session.login.token)
}

/* Listen and handle private posts */
bot.command('start', ctx => {
    // check if sender is admin
    if (db.isAdminFromTGid(ctx.from.id)){

        console.log(ctx.chat.id)
        if (ctx.chat.id == db.getGroupFromName('IN')[0].tg_id) {
        
            startNotifications(ctx, "IN")
        
        } else if (ctx.chat.id == db.getGroupFromName('OUT')[0].tg_id) {
        
            startNotifications(ctx, "OUT")
        }
    }
})

bot.command('stop', ctx => {
    // check if sender is admin
    if (db.isAdminFromTGid(ctx.from.id)){

        if (ctx.chat.id == db.getGroupFromName('IN')[0].tg_id) {
        
            clearInterval(si_donations);

        } else if (ctx.chat.id == db.getGroupFromName('OUT')[0].tg_id) {
        
            clearInterval(si_offers);
        }

        ctx.replyWithMarkdown('🍌 *BOTTO spento!*\nBye bye 👋')
    }
})

bot.on("inline_query", async ctx => {
    ctx.answerInlineQuery("Hello");
})

/* Listen and handle channel posts */
bot.on('text', ctx => {

    if (ctx.message.text.includes(ctx.me) && db.isAdminFromTGid(ctx.from.id)) {
    
        startMenu(ctx)
    
    }
})

bot.launch()

console.log("Hello, I am 🍌 BOTTO the Bot!")
createSession()

/* Enable graceful stop */
process.once('SIGINT', () => { bot.stop('SIGINT')})
process.once('SIGTERM', () => { bot.stop('SIGTERM')})
