const { GraphQLClient } = require('graphql-request')
const { Markup, Scenes, session, Telegraf } = require('telegraf')
const fs = require("fs");
const path = require("path");
const puppeteer = require('puppeteer');
const handlebars = require("handlebars")
const base64Img = require('base64-img');

const config = require('./config')
const db = require('./db')
const secrets = require('./secrets')
const queries = require('./queries')

const bot = new Telegraf(secrets.bot.token)

var si_donations;
var DEBUG = false
// object to handle offers timeouts and reminders
var timeouts = {}
var reminders = {}
// object to handle current donation
var curDonation = {}
// object to handle current sorted resource
var curSorting = {}
// object to handle current transfered resource
var curTransfer = {}
// keep track of current donation number
var lastDonationTS = 0

const client = new GraphQLClient(config.reflow.api_url)

async function request(query, vars) {
    try {
        const data = await client.request(query, vars);
        return data;
    } catch (e) {
        
        console.log(e)
        if('response' in e) {  // Use GQL error if we got a response.
            let error = e.response.errors[0]
            if (error.code === 'needs_login') {  // Special case of expired session
                await createSession()
                const data = await client.request(query, vars);
                return data;
            } else {
                throw(error)  // Or throw GraphQL error with meaningful error
            }
        }
        else {  // No GQL response, could be network error.
            throw(e)
        }
    }
}

async function generateDoc(uid, res, d) {

    if (d === undefined)
        var date = new Date()
    else
        var date = new Date(d)

    var options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }
    
    
    res['date'] = date.toLocaleDateString("it-IT", options)

    var u = db.getUserFromRFid(uid)
    console.log(u)

    if (u.length > 0){
        if (u[0].name.includes('Opera')){
            res['receiver'] = 0
            res['img_r_src'] = base64Img.base64Sync('./CRI_Opera_mark.png');
        } else {
            res['receiver'] = 1
            res['img_r_src'] = base64Img.base64Sync('./CRI_SD_mark.png');
        }
    }
    
    var templateHtml = fs.readFileSync(path.join(process.cwd(), 'template.html'), 'utf8');
    var template = handlebars.compile(templateHtml);
    var finalHtml = template(res);


    var fname_date = date.toISOString().substring(0,10)
    var pdfPath = path.join('pdf', `${uid}-${fname_date}.pdf`);
    
    var options = {
        format: 'A4',
        headerTemplate: "<p></p>",
        footerTemplate: "<p></p>",
        displayHeaderFooter: false,
        margin: {
            top: "40px",
            bottom: "100px"
        },
        printBackground: true,
        path: pdfPath
    }

    const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true
    });
    const page = await browser.newPage();
    await page.setContent(finalHtml,{ waitUntil: 
        ['domcontentloaded', 'load', "networkidle0"] })
    await page.pdf(options)
    await browser.close();

    return pdfPath
}

function now() {
    return new Date().toISOString()
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
    ctx.reply('Quanti colli sono stati donati?');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (isNaN(ctx.message.text)) {
      ctx.reply('Perfavore inserisci un numero.');
      return; 
    }    
    ctx.wizard.state.donation.quantity = parseFloat(ctx.message.text);
    var btns = []

    db.providers.forEach(p => {
        btns.push([Markup.button.text(p.name)])
    })

    ctx.reply('Chi li ha donati?', Markup.keyboard(btns))

    return ctx.wizard.next();
  },  
  async (ctx) => {

    provider = db.getProviderByName(ctx.message.text)

    if (!provider.length){
      ctx.reply('Non conosco questo fornitore. Riprova.');
      return;         
    }

    ctx.reply("Grazie!", Markup.removeKeyboard())

    ctx.wizard.state.donation.provider = provider[0].name;
    
    curDonation = ctx.wizard.state.donation

    message = '🍌 *Riepilogo donazione*'
    message += '\n*Prodotto* ' + curDonation.name
    message += '\n*Quantità* ' + curDonation.quantity + ' colli'
    message += '\n*Donatore* ' + provider[0].name + ' (' + provider[0].key + ')'

    ctx.replyWithMarkdown(message,
    Markup.inlineKeyboard([
        [Markup.button.callback('Modifica ✏️', `newDonation`),
         Markup.button.callback('Annulla ❌', `startMenu`)],
        [Markup.button.callback('Salva ✔️', `recordDonation`)]
    ]))

    return ctx.scene.leave();
  },
);

const sortingWizard = new Scenes.WizardScene('sorting-wizard', (ctx) => {
    ctx.replyWithMarkdown('*Selezione*\nQuale prodotto hai smistato?');

    ctx.wizard.state.sorting = {};
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || ctx.message.text.length <= 2) {
      ctx.reply('Non ho capito, riprova.');
      return; 
    }
    ctx.wizard.state.sorting.name = ctx.message.text;
    
    ctx.reply('Quale era il peso iniziale? (in kg)');
    
    return ctx.wizard.next();
  },
   async (ctx) => {
    if (!ctx.message || isNaN(ctx.message.text)) {
      ctx.reply('Perfavore inserisci un numero.');
      return; 
    }

    if (parseFloat(ctx.message.text) <= 0){
      ctx.reply('Il peso iniziale non può essere negativo.');
      return;         
    }    

    ctx.wizard.state.sorting.start_quantity = parseFloat(ctx.message.text);
    
    ctx.reply('Quale è il peso finale? (in kg)')

    return ctx.wizard.next();
  },
   async (ctx) => {
    if (!ctx.message || isNaN(ctx.message.text)) {
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

    ctx.wizard.state.sorting.notes = ""

    curSorting = ctx.wizard.state.sorting;

    var message = '🍌 *Riepilogo selezione*'
    message += '\nRecuperati ' + curSorting.end_quantity + ' kg di ' + curSorting.name + ' su ' + curSorting.start_quantity +' kg iniziali.'

    ctx.replyWithMarkdown(message,
    Markup.inlineKeyboard([
        [Markup.button.callback('Modifica ✏️', `newSorting`),
         Markup.button.callback('Annulla ❌', `startMenu`)],
        [Markup.button.callback('Salva ✔️', `recordSorting`)]
    ]))

    return ctx.scene.leave();
  },
);

async function transferHelper(ctx) {

        var start = new Date();
        start.setHours(0,0,0,0);

        var end = new Date();
        end.setHours(23,59,59,999);

        var agent_id = db.getRECUP()[0].reflow_id

        var res = await request(queries.getDailyReport, {action:"consume", provider_id: agent_id, receiver_id: agent_id, start_date: start.toISOString(), end_date: end.toISOString()})

        if (res.economicEventsFiltered.length == 0){
            ctx.reply("Non hai ancora effettuato smistamenti ☹️")
            return
        }

        var btns = []

        res.economicEventsFiltered.forEach(r => {
            console.log(r)
            r = r.resourceInventoriedAs
            var name = r.name
            var qty = r.onhandQuantity.hasNumericalValue
            var unit = r.onhandQuantity.hasUnit.symbol

            if (qty > 0) {
                var btn_text = name + ' / ' + qty + ' ' + unit

                btns.push([Markup.button.callback(btn_text, `recordTransfer ${r.id}`)])
            }
        })

        btns.push([Markup.button.callback('Annulla', `startMenu`)])
        ctx.replyWithMarkdown('*Ritiro*\nQuale prodotto vuoi trasferire?', Markup.inlineKeyboard(btns));
    
        return ctx.scene.leave();
}

const transferWizard = new Scenes.WizardScene('transfer-wizard', async (ctx) => {

        if (Object.keys(curSorting).length > 0) {

            console.log(curSorting)
            curTransfer = curSorting
       
            var btns = []

            db.getReceivers().forEach(p => {
                btns.push([Markup.button.text(p.name)])
            })

            ctx.reply('A chi lo hai donato?', Markup.keyboard(btns))
            return ctx.wizard.next();
        
        } else 
            return ctx.scene.leave();

    },
    async (ctx) => {

        receiver = db.getUserByName(ctx.message.text)

        if (!receiver.length){
          ctx.reply('Non conosco questo utente. Riprova.');
          return;         
        }

        curTransfer.receiver = receiver[0].reflow_id;
        curTransfer.provider = db.getRECUP()[0].reflow_id

        ctx.reply('Quanti kg ha ritirato?', Markup.removeKeyboard())
        return ctx.wizard.next();
    },
    async (ctx) => {
    
        if (!ctx.message || isNaN(ctx.message.text)) {
            ctx.reply('Perfavore inserisci un numero.');
            return; 
        }
    
        if (ctx.message.text > curTransfer.end_quantity){
          ctx.reply('Il peso donato non può essere maggiore di quello smistato.');
          return;         
        }

        if (parseFloat(ctx.message.text) <= 0){
          ctx.reply('Il peso donato non può essere negativo.');
          return;         
        }

        curTransfer.qty = parseFloat(ctx.message.text);

        var u_id = db.getUnitByLabel('kg')[0].reflow_id
        
        var quantity = {hasUnit: u_id, hasNumericalValue: curTransfer.qty}

        console.log('> Saving transfer')

        var res = await request(queries.recordAction, {action: "transfer", provider_id: curTransfer.provider, receiver_id: curTransfer.receiver, quantity: quantity, resource_id: curTransfer.resource_id, date: now()})

        console.log(res)

        ctx.reply('Grazie, trasferimento registrato!', Markup.removeKeyboard()).then(startMenu(ctx))
        
        curSorting = {}
        curTransfer = {}
        return ctx.scene.leave();
  },

);

const stage = new Scenes.Stage([donationWizard, sortingWizard, transferWizard]);
bot.use(session());
bot.use(stage.middleware());

bot.action('startMenu', async (ctx) => {
    curDonation = {}    
    curSorting = {}
    curTransfer = {}

    //await ctx.editMessageReplyMarkup({ inline_keyboard: null }, { chat_id: ctx.callbackQuery.message.chat.id, message_id: ctx.callbackQuery.message.message_id });    
    startMenu(ctx);
});

bot.action('newDonation', async (ctx) => {
    //await ctx.editMessageReplyMarkup({ inline_keyboard: null }, { chat_id: ctx.callbackQuery.message.chat.id, message_id: ctx.callbackQuery.message.message_id });    
    ctx.scene.enter('donation-wizard')
})

bot.action('newSorting', async (ctx) => {
    //await ctx.editMessageReplyMarkup({ inline_keyboard: null }, { chat_id: ctx.callbackQuery.message.chat.id, message_id: ctx.callbackQuery.message.message_id });    
    ctx.scene.enter('sorting-wizard')
})

bot.action('newTransfer', async (ctx) => {
    //await ctx.editMessageReplyMarkup({ inline_keyboard: null }, { chat_id: ctx.callbackQuery.message.chat.id, message_id: ctx.callbackQuery.message.message_id });    
    ctx.scene.enter('transfer-wizard')
})

bot.action('recordSorting', async (ctx) => {

    if (Object.keys(curSorting).length > 0){

        var p_id = db.getRECUP()[0].reflow_id
        var u_id = db.getUnitByLabel('kg')[0].reflow_id
        var init_qnt = {hasUnit: u_id, hasNumericalValue: curSorting.start_quantity}
        var tag = db.getTagFromLabel('sorted')[0].reflow_id
        var notes = curSorting.notes

        var res = await request(queries.recordActionNewResource, {action: "produce", provider_id: p_id, receiver_id: p_id, quantity: init_qnt, product_name: curSorting.name, tags: tag, notes: notes, date: now()})

        console.log("> Produce done.")
        
        curSorting.resource_id = res.createEconomicEvent.economicEvent.resourceInventoriedAs.id

        var consume_qnt = {hasUnit: u_id, hasNumericalValue: curSorting.start_quantity - curSorting.end_quantity}

        var res = await request(queries.recordAction, {action:"consume", provider_id: p_id, quantity: consume_qnt, resource_id: curSorting.resource_id, date: now()})

        console.log("> Consume done.")
        console.log(res)

        await ctx.editMessageReplyMarkup({ inline_keyboard: null }, { chat_id: ctx.callbackQuery.message.chat.id, message_id: ctx.callbackQuery.message.message_id });    
        
        await sendOffer(ctx, curSorting)

        ctx.reply('Grazie, selezione registrata!').then(async () => {
            console.log(curSorting);
            ctx.replyWithMarkdown("Vuoi registrare anche il suo trasferimento?",
                Markup.inlineKeyboard([
                Markup.button.callback('👎 No', `startMenu`),
                Markup.button.callback('👍 Si', `newTransfer`)
            ]))
        });
    }
})

bot.action('recordDonation', async (ctx) => {
    await ctx.editMessageReplyMarkup({ inline_keyboard: null }, { chat_id: ctx.callbackQuery.message.chat.id, message_id: ctx.callbackQuery.message.message_id });    
    
    if (Object.keys(curDonation).length > 0){
        console.log('> Saving donation:')
        console.log(curDonation);

        var p_id = db.getProviderByName(curDonation.provider)[0].reflow_id
        var r_id = db.getRECUP()[0].reflow_id
        var u_id = db.getUnitByLabel('colli')[0].reflow_id
        var quantity = {hasUnit: u_id, hasNumericalValue: curDonation.quantity}

        var res = await request(queries.recordActionNewResource, {action: "transfer", provider_id: p_id, receiver_id: r_id, quantity: quantity, product_name: curDonation.name, date: now()})

        console.log(res)

        ctx.reply('Grazie, donazione registrata!').then(startMenu(ctx))
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

    request(queries.getIntent, {intent_id: donationID}).then((res) => {

        console.log(res)
        var unit = res.intent.availableQuantity.hasUnit.id

        request(queries.createCommitment, {provider_id: db.getRECUP()[0].reflow_id , receiver_id: res.intent.provider.id, date: now()}).then((res) => {

            let quantity = {hasUnit: unit, hasNumericalValue: 0}

            request(queries.createSatisfaction, {intent_id: donationID, commitment_id: res.createCommitment.commitment.id, quantity: quantity}).then((res) => {

                console.log("> Donation refused!")

                console.log(res)

            })
        })
    })
}

function acceptDonation(donationID) {
    stopDonationTimer(donationID)

    console.log(donationID)

    request(queries.getIntent, {intent_id: donationID}).then((res) => {

        console.log(res)
        var unit = res.intent.availableQuantity.hasUnit.id
        var qty = res.intent.availableQuantity.hasNumericalValue

        request(queries.createCommitment, {provider_id: db.getRECUP()[0].reflow_id , receiver_id: res.intent.provider.id, date: now()}).then((res) => {

            let quantity = {hasUnit: unit, hasNumericalValue: qty}

            request(queries.createSatisfaction, {intent_id: donationID, commitment_id: res.createCommitment.commitment.id, quantity: quantity}).then((res) => {

                console.log("> Donation accepted!")

                console.log(res)

            })
        })
    })
}

/* Parse and format GraphQL response to Telegram message */
async function parseDonations(ctx, data) {
    for (const x of data) {
        console.log(x)
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

async function sendOffer(ctx, data) {

    var message = '📦 Nuova donazione'

    message += '\nSono disponibili per il ritiro ' + data.end_quantity + ' kg'
    message += ' di ' + data.name + '.'

    if (data.note)
        message += '\nNote: ' + data.note
    
    message += "\n\nTi interessa?"

    var g_id = db.getGroupFromName('OUT')[0].tg_id

    await ctx.telegram.sendMessage(g_id, message, Markup.inlineKeyboard([
                Markup.button.callback('👍 Si', `acceptOffer`),
                Markup.button.callback('👎 No', `refuseOffer`)])
                )
}

bot.action('acceptOffer', (ctx, next) => {
    console.log(ctx)
    // get user id
    let u_id = db.getUserFromTGid(ctx.from.id)
    // get old message text
    let msg = ctx.update.callback_query.message.text 
    if (u_id.length > 0){
        msg += '\n👍 Interessa a '+ u_id[0].name 
        return ctx.editMessageText(msg, Markup.inlineKeyboard([
                Markup.button.callback('👍 Si', `acceptOffer`),
                Markup.button.callback('👎 No', `refuseOffer`)])
                )
    }
})

bot.action('refuseOffer', (ctx, next) => {
    // get user id
    let u_id = db.getUserFromTGid(ctx.from.id)
    // get old message text
    let msg = ctx.update.callback_query.message.text
    if (u_id.length > 0){
        msg += '\n👎 Non interessa a '+ u_id[0].name
        return ctx.editMessageText(msg, Markup.inlineKeyboard([
                Markup.button.callback('👍 Si', `acceptOffer`),
                Markup.button.callback('👎 No', `refuseOffer`)])
                )
    }
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
    // get resourceid to transfer
    curSorting.resource_id = ctx.match[1]
    ctx.scene.enter('transfer-wizard')
})

bot.command('debugbolla', async ctx => {
    var args = ctx.update.message.text.split(' ')

    var agent_id = args[1]
    var date = args[2]

    var start = new Date(date);
    start.setHours(0,0,0,0);

    var end = new Date(date);
    end.setHours(23,59,59,999);

    var res = await request(queries.getDailyReport, {action: "transfer", provider_id: db.getRECUP()[0].reflow_id, receiver_id: agent_id, start_date: start.toISOString(), end_date: end.toISOString()})
    if (res.economicEventsFiltered.length == 0)
        ctx.reply("Oggi non hai effettuato ritiri ☹️")
    else {
        ctx.reply("Oggi hai effettuato " + res.economicEventsFiltered.length + " ritiri.\n⌛ Genero la bolla...")
        try {
            var filename = await generateDoc(agent_id, res, date)
            console.log(filename)
            await ctx.reply("Bolla pronta! 🚀")
            await ctx.replyWithDocument({source: filename});
        } catch (err) {
             console.log('ERROR:', err);
            }
    }
})


bot.command('bolla', async ctx => {
    console.log(String(ctx.from.id))

    // check if user is registered
    var u = db.getUserFromTGid(ctx.from.id)
    console.log(u)
    if (u.length > 0) {
        var agent_id = u[0].reflow_id

        if (agent_id.length > 0) {
            var start = new Date();
            start.setHours(0,0,0,0);

            var end = new Date();
            end.setHours(23,59,59,999);

            var res = await request(queries.getDailyReport, {action: "transfer", provider_id: db.getRECUP()[0].reflow_id, receiver_id: agent_id, start_date: start.toISOString(), end_date: end.toISOString()})
            if (res.economicEventsFiltered.length == 0)
                ctx.reply("Oggi non hai effettuato ritiri ☹️")
            else {
                ctx.reply("Oggi hai effettuato " + res.economicEventsFiltered.length + " ritiri.\n⌛ Genero la bolla...")
                try {
                    var filename = await generateDoc(agent_id, res)
                    console.log(filename)
                    await ctx.reply("Bolla pronta! 🚀")
                    await ctx.replyWithDocument({source: filename});
                } catch (err) {
                   console.log('ERROR:', err);
                }
            }
        }        
    }
})

// Debug only : make a request to get all donations
bot.command('debugme', async ctx => {
    DEBUG = true
    startMenu(ctx)
})


// Debug only : make a request to get all donations
bot.command('now', async ctx => {
    console.log(String(ctx.from.id))

    // check if sender is admin
    if (db.isAdminFromTGid(ctx.from.id)){
        
        // GraphQL - request all Intents made for a specific Agent and without Satisfaction
        var res = await request(queries.getIntents, {receiver_id: db.getRECUP()[0].reflow_id})
            
        if (res.intents.length > 0){
            // return all intents to Telegram
            parseDonations(ctx, res.intents)
        }
    }
})

bot.on('callback_query', function(ctx){
    const menu_item = ctx.update.callback_query.data;
    
    if (db.isAdminFromTGid(ctx.from.id)) {
        ctx.deleteMessage();

        switch(menu_item) {
            case 'menu_donation' : return ctx.scene.enter('donation-wizard'); break;
            case 'menu_sorting'  : return ctx.scene.enter('sorting-wizard'); break;
            case 'menu_transfer' : return transferHelper(ctx); break;
        }
    }
});

function getDonations(ctx) {

    // GraphQL - request all new Intents made for a specific Agent

    // get donations timestamp end
    var newDonationsTS = new Date()
    
    if (lastDonationTS == 0)
        // get start timestamp as old as 30 minutes ago
        lastDonationTS = new Date(newDonationsTS - config.bot.donation_timeout)
    
    //console.log(lastDonationTS)
    console.log(newDonationsTS)
    console.log(">> Checking for donations")
    request(queries.getIntents, {receiver_id: db.getRECUP()[0].reflow_id, start_date: lastDonationTS.toISOString(), end_date: newDonationsTS.toISOString()}).then((res) => {
    
        lastDonationTS = newDonationsTS
        
        //console.log("> Current donations #" + res.intents.length)

        if (res.intents.length > 0) {
            // return all intents to Telegram
            parseDonations(ctx, res.intents)
        
        }  else {
            //console.log("> No new donations.")
        }
    })
}

function startMenu(ctx) {
    curDonation = {}    
    curSorting = {}
    curTransfer = {}
     
    ctx.replyWithMarkdown('🍌 Ciao, cosa vuoi registrare?', {
       'reply_markup': {
           'inline_keyboard': [[{
                text: '1. Donazione',
                callback_data: 'menu_donation'
            }],[{
                text: '2. Selezione',
                callback_data: 'menu_sorting'
            }],[{
                text: '3. Ritiro',
                callback_data: 'menu_transfer'
            }]]
        }
    })
}

function startNotifications(ctx, group_name) {
    
    ctx.replyWithMarkdown('🍌 *BOTTO avviato!*\nRiceverai aggiornamenti sulle donazioni ogni ' + config.bot.polling_time/1000 + ' secondi.')

    if (group_name == "IN") {

        si_donations = setInterval(() => { getDonations(ctx) } , config.bot.polling_time)
    
    }
}

async function createSession() {
    var session = await request(queries.login, {username: secrets.reflow.username, password: secrets.reflow.password})
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

        }

        ctx.replyWithMarkdown('🍌 *BOTTO spento!*\nBye bye 👋')
    }
})

bot.on("inline_query", async ctx => {
    ctx.answerInlineQuery("Hello");
})

/* Listen and handle channel posts */
bot.on('text', ctx => {
    console.log(ctx.from.id)
    if (ctx.message.text.includes(ctx.me) && db.isAdminFromTGid(ctx.from.id) && ctx.chat.id == db.getGroupFromName('IN')[0].tg_id) {
    
        startMenu(ctx)
    
    }
})

bot.launch()

console.log("Hello, I am 🍌 BOTTO the Bot!")
createSession()

/* Enable graceful stop */
process.once('SIGINT', () => { bot.stop('SIGINT')})
process.once('SIGTERM', () => { bot.stop('SIGTERM')})
