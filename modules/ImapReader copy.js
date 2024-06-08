

function getFirstTwentyEmails(emailAddress, password, threads, previousSubject) {

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

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { inspect } = require('util');

function emailDelete(emailAddress, appPassword, inReplyTo) {
    const imap = new Imap({
        user: emailAddress,
        password: appPassword,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: {
            rejectUnauthorized: false
        }
    });

    function openInbox(cb) {
        imap.openBox('INBOX', false, cb); // set readOnly to false
    }

    imap.once('ready', function () {
        openInbox(function (err, box) {
            if (err) throw err;
            imap.search(['ALL'], function (err, results) {
                if (err) throw err;
                const fetch = imap.fetch(results, { bodies: '', struct: true });
                fetch.on('message', function (msg, seqno) {
                    msg.on('body', function (stream, info) {
                        let buffer = '';
                        stream.on('data', function (chunk) {
                            buffer += chunk.toString('utf8');
                        });
                        stream.once('end', function () {
                            simpleParser(buffer, (err, parsed) => {
                                if (parsed.headers.get('in-reply-to') === inReplyTo) {
                                    console.log('Deleting message %d', seqno);
                                    imap.addFlags(seqno, '\\Deleted', function (err) {
                                        if (err) console.error('Error marking message for deletion:', err);
                                    });
                                }
                            });
                        });
                    });
                });
                fetch.once('error', function (err) {
                    console.error('Fetch error:', err);
                });
                fetch.once('end', function () {
                    console.log('All messages marked for deletion');
                    imap.expunge(function (err) {
                        if (err) console.error('Expunge error:', err);
                        else console.log('Messages deleted successfully');
                        imap.end();
                    });
                });
            });
        });
    });

    imap.once('error', function (err) {
        console.error(err);
    });

    imap.once('end', function () {
        console.log('Connection ended');
    });

    imap.connect();
}






// Example usage:
// emailDelete('your_email@example.com', 'your_app_password', 'message_id_of_first_email');







module.exports = {
    getFirstTwentyEmails,
    emailDelete
};
