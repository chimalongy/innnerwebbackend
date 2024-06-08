const { ImapFlow } = require('imapflow');
const ImapSimple = require('imap-simple');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { inspect } = require('util');
const { rejects } = require('assert');

function getFirstTwentyEmails(emailAddress, password, threads, previousSubject) {
    //  THIS FUNCTOIN USES THE 'Imap' module to read emails partaining to a search query provided here 
    console.log(`
        email:${emailAddress},
        password:${password}
    `);

    const imapConfig = {
        user: emailAddress,
        password: password,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: {
            rejectUnauthorized: false
        }
    };

    // Create new IMAP instance
    const imap = new Imap(imapConfig);

    // Function to fetch emails
    function fetchEmails() {
        return new Promise((resolve, reject) => {
            let returnValue = [];
            imap.openBox('INBOX', true, (err, box) => {
                if (err) reject(err);

                // Search for all emails
                imap.search(['ALL'], (err, results) => {
                    if (err) reject(err);

                    // Reverse the order of search results to get the most recent emails first
                    results.reverse();

                    // Limit the number of emails to retrieve
                    const limitedResults = results.slice(0, 35); // Limit to 20 emails

                    const fetchPromises = limitedResults.map((emailId) => {
                        return new Promise((resolveFetch, rejectFetch) => {
                            const fetchOptions = {
                                bodies: '',
                                struct: true
                            };

                            // Fetch the email
                            const fetch = imap.fetch(emailId, fetchOptions);
                            fetch.on('message', (msg) => {
                                let body = '';

                                msg.on('body', (stream) => {
                                    simpleParser(stream, async (err, parsed) => {
                                        if (err) rejectFetch(err);

                                        // Extract date, sender, and subject
                                        const date = parsed.date;
                                        const from = parsed.from.text;
                                        const subject = parsed.subject;
                                        const inReplyTo = parsed.inReplyTo;
                                        const messageID = parsed.messageId;
                                        body = parsed.text;
                                        console.log(subject)
                                        console.log(previousSubject)
                                        if (subject.includes(previousSubject)) {
                                            returnValue.push({
                                                from: from,
                                                date: date,
                                                subject: subject,
                                                body: body,
                                                inReplyTo: inReplyTo,
                                                email: emailAddress,
                                                password: password,
                                                messageId: messageID
                                            });
                                        }
                                        if (threads.includes(inReplyTo)) {
                                            returnValue.push({
                                                from: from,
                                                date: date,
                                                subject: subject,
                                                body: body,
                                                inReplyTo: inReplyTo,
                                                email: emailAddress,
                                                password: password,
                                                messageId: messageID
                                            });
                                        }


                                        resolveFetch();
                                    });
                                });
                            });
                        });
                    });

                    Promise.all(fetchPromises)
                        .then(() => resolve(returnValue))
                        .catch(reject);
                });
            });
        });
    }

    // Connect to the IMAP server
    return new Promise((resolve, reject) => {
        imap.once('ready', () => {
            console.log('Connected to IMAP server');
            fetchEmails()
                .then((results) => {
                    imap.end(); // Close the connection after fetching emails
                    resolve(results); // Resolve with the fetched emails
                })
                .catch(reject);
        });

        // Log any errors
        imap.once('error', (err) => {
            console.error('IMAP error:', err);
            reject(err);
        });

        // Start the IMAP connection
        imap.connect();
    });
}


async function fetchEmailsBySubject(email, password, threads, subject) {
    console.log(`
            searching for
            email:${email},
            password:${password},
            subject: ${subject}

    `)
    //  THIS FUNCTOIN USES THE 'Imapflow' module to read emails partaining to a search query provided here 
    // Imapflow is faster than Imap
    return new Promise(async (resolve, reject) => {
        const client = new ImapFlow({
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            auth: {
                user: email,
                pass: password
            },
            tls: {
                rejectUnauthorized: false
            },
            logger: false
        });

        let returnValue = [];
        const main = async () => {
            // Wait until client connects and authorizes
            await client.connect()


            // Select and lock a mailbox. Throws if mailbox does not exist
            let lock = await client.getMailboxLock('INBOX');
            try {
                // Fetch the last 35 messages
                const totalMessages = client.mailbox.exists;
                const start = totalMessages > 35 ? (totalMessages - 34) : 1; // Start from the appropriate index
                const end = totalMessages; // Fetch until the last message

                for await (let message of client.fetch(`${start}:${end}`, { envelope: true, struct: ['HEADER', 'TEXT', 'BODY'], source: true })) {
                    if ((message.envelope.inReplyTo) || subject.includes(message.envelope.subject)) {
                        if (threads.includes(message.envelope.inReplyTo)) {
                            const parsed = await simpleParser(message.source);
                            returnValue.push({
                                email: email,
                                password: password,
                                from: parsed.from.text,
                                date: parsed.date,
                                subject: parsed.subject,
                                messageId: parsed.messageId,
                                inReplyTo: parsed.inReplyTo,
                                body: parsed.textAsHtml || parsed.textAsPlain,
                            });
                        }
                        if (subject.includes(message.envelope.subject) && !threads.includes(message.envelope.inReplyTo)) {
                            const parsed = await simpleParser(message.source);
                            returnValue.push({
                                email: email,
                                password: password,
                                from: parsed.from.text,
                                date: parsed.date,
                                subject: parsed.subject,
                                messageId: parsed.messageId,
                                inReplyTo: parsed.inReplyTo,
                                body: parsed.textAsHtml || parsed.textAsPlain,
                            });
                        }
                    }
                }
            } finally {
                // Make sure lock is released, otherwise next `getMailboxLock()` never returns
                lock.release();
            }

            // Log out and close connection
            await client.logout();
            resolve(returnValue); // Resolve with the returnValue after the emails are fetched
        };

        main().catch(err => {
            resolve([])
        });
    });
}


async function fetchSpamEmailsBySubject(email, password, threads, subject) {
    // usese Imap flow for the spam folder
    return new Promise(async (resolve, reject) => {
        const client = new ImapFlow({
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            auth: {
                user: email,
                pass: password
            },
            tls: {
                rejectUnauthorized: false
            },
            logger: false
        });

        let returnValue = [];
        const main = async () => {
            // Wait until client connects and authorizes
            await client.connect();

            // Select and lock the spam mailbox. Throws if the mailbox does not exist
            let lock = await client.getMailboxLock('[Gmail]/Spam'); // Modify this line to specify the spam folder
            try {
                // Fetch the last 35 messages from the spam folder
                const totalMessages = client.mailbox.exists;
                const start = totalMessages > 35 ? (totalMessages - 34) : 1; // Start from the appropriate index
                const end = totalMessages; // Fetch until the last message

                for await (let message of client.fetch(`${start}:${end}`, { envelope: true, struct: ['HEADER', 'TEXT', 'BODY'], source: true })) {
                    if ((message.envelope.inReplyTo) || subject.includes(message.envelope.subject)) {
                        if (threads.includes(message.envelope.inReplyTo)) {
                            const parsed = await simpleParser(message.source);
                            returnValue.push({
                                email: email,
                                password: password,
                                from: parsed.from.text,
                                date: parsed.date,
                                subject: parsed.subject,
                                messageId: parsed.messageId,
                                inReplyTo: parsed.inReplyTo,
                                body: parsed.textAsHtml || parsed.textAsPlain,
 
                            });
                        }
                        if (subject.includes(message.envelope.subject) && !threads.includes(message.envelope.inReplyTo)) {
                            const parsed = await simpleParser(message.source);
                            returnValue.push({
                                email: email,
                                password: password,
                                from: parsed.from.text,
                                date: parsed.date,
                                subject: parsed.subject,
                                messageId: parsed.messageId,
                                inReplyTo: parsed.inReplyTo,
                                body: parsed.textAsHtml || parsed.textAsPlain,
                            });
                        }
                    }
                }
            } finally {
                // Make sure lock is released, otherwise next `getMailboxLock()` never returns
                lock.release();
            }

            // Log out and close connection
            await client.logout();
            resolve(returnValue); // Resolve with the returnValue after the emails are fetched
        };

        main().catch(err => {
            resolve([]); // Reject if there's an error during the process
        });
    });
}

async function deleteThread(email, password, messageId) {
    // This uses the ImapSimple to delete a message
    const imapConfig = {
        imap: {
            user: email,
            password: password,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            authTimeout: 3000,
            tlsOptions: {
                rejectUnauthorized: false
            }
        }
    };

    let connection;
    try {
        // Connect to the IMAP server
        connection = await ImapSimple.connect(imapConfig);

        // Open the INBOX
        await connection.openBox('INBOX');

        // Search for the message by Message-ID
        const searchCriteria = [['HEADER', 'Message-ID', messageId]];
        const results = await connection.search(searchCriteria);

        if (results.length === 0) {
            console.log('No email found with Message-ID:', messageId);
            return;
        }

        // Mark the message as deleted
        const sequenceNumbers = results.map(result => result.attributes.uid);
        await connection.imap.addFlags(sequenceNumbers, '\\Deleted');

        // Expunge the mailbox to permanently delete the message
        await connection.imap.expunge();

        console.log('Email(s) with Message-ID:', messageId, 'deleted successfully');
    } catch (error) {
        console.error('Error deleting message:', error);
    } finally {
        // Close the connection
        if (connection) {
            await connection.end();
        }
    }
}












module.exports = {
    getFirstTwentyEmails,

    fetchEmailsBySubject,

    fetchSpamEmailsBySubject
};
