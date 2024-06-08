
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const Imap = require('imap');







//WORKING PROPERLY
// const readEmails = (config) => {
//     return new Promise((resolve, reject) => {
//         const Imap = require('imap'); // Ensure you require the Imap module
//         const { simpleParser } = require('mailparser'); // Ensure you require the simpleParser from mailparser

//         const imap = new Imap(config.imap);

//         const openInbox = (cb) => {
//             imap.openBox('INBOX', true, cb);
//         };

//         imap.once('ready', () => {
//             openInbox((err, box) => {
//                 if (err) {
//                     reject(err);
//                     return;
//                 }

//                 const fetchOptions = {
//                     bodies: '',
//                     struct: true,
//                 };

//                 imap.search(['ALL'], (err, results) => {
//                     if (err) {
//                         reject(err);
//                         return;
//                     }

//                     const fetch = imap.fetch(results, fetchOptions);
//                     const emails = [];
//                     const parsePromises = [];

//                     fetch.on('message', (msg, seqno) => {
//                         let email = {};

//                         const parsePromise = new Promise((resolve, reject) => {
//                             msg.on('body', (stream, info) => {
//                                 simpleParser(stream, (err, parsed) => {
//                                     if (err) {
//                                         reject(err);
//                                         return;
//                                     }

//                                     email.sender = parsed.from.text;
//                                     email.inReplyTo = parsed.inReplyTo || '';
//                                     email.references = parsed.references || [];
//                                     email.subject = parsed.subject;
//                                     email.date = parsed.date;
//                                     email.body = parsed.text;
//                                     resolve();
//                                 });
//                             });

//                             msg.once('attributes', (attrs) => {
//                                 email.attributes = attrs;
//                             });

//                             msg.once('end', () => {
//                                 console.log(`Finished email #${seqno}`);
//                                 emails.push(email);
//                             });
//                         });

//                         parsePromises.push(parsePromise);
//                     });

//                     fetch.once('error', (err) => {
//                         reject(err);
//                     });

//                     fetch.once('end', () => {
//                         console.log('Done fetching all messages!');
//                         Promise.all(parsePromises)
//                             .then(() => {
//                                 imap.end();
//                                 resolve(emails);
//                             })
//                             .catch((err) => {
//                                 reject(err);
//                             });
//                     });
//                 });
//             });
//         });

//         imap.once('error', (err) => {
//             console.error(err);
//             reject(err);
//         });

//         imap.once('end', () => {
//             console.log('Connection ended');
//         });

//         imap.connect();
//     });
// };



const readEmails = (config) => {
    return new Promise((resolve, reject) => {
        const Imap = require('imap'); // Ensure you require the Imap module
        const { simpleParser } = require('mailparser'); // Ensure you require the simpleParser from mailparser

        const imap = new Imap(config.imap);

        const openInbox = (cb) => {
            imap.openBox('INBOX', true, cb);
        };

        imap.once('ready', () => {
            openInbox((err, box) => {
                if (err) {
                    reject(err);
                    return;
                }

                const fetchOptions = {
                    bodies: '',
                    struct: true,
                };

                imap.search(['ALL'], (err, results) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const fetch = imap.fetch(results, fetchOptions);
                    const emails = [];
                    const parsePromises = [];

                    fetch.on('message', (msg, seqno) => {
                        let email = {};

                        const parsePromise = new Promise((resolve, reject) => {
                            msg.on('body', (stream, info) => {
                                simpleParser(stream, (err, parsed) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    
                                    email.sender = parsed.from.text;
                                    email.inReplyTo = parsed.inReplyTo || '';
                                    email.references = parsed.references || [];
                                    email.subject = parsed.subject;
                                    email.date = parsed.date;
                                    email.body = parsed.text;
                                    email.messageId = parsed.messageId;
                                    resolve();
                                });
                            });

                            msg.once('attributes', (attrs) => {
                                email.attributes = attrs; 
                                
                            });

                            msg.once('end', () => {
                                //console.log(`Finished email #${seqno}`);
                                emails.push(email);
                            });
                        });

                        parsePromises.push(parsePromise);
                    });

                    fetch.once('error', (err) => {
                        reject(err);
                    });

                    fetch.once('end', () => {
                        //console.log('Done fetching all messages!');
                        Promise.all(parsePromises)
                            .then(() => {
                                imap.end();
                                resolve(emails);
                            })
                            .catch((err) => {
                                reject(err);
                            });
                    });
                });
            });
        });

        imap.once('error', (err) => {
            console.error(err);
            reject(err);
        });

        imap.once('end', () => {
           // console.log('Connection ended');
        });

        imap.connect();
    });
};



 


module.exports ={
    readEmails,
} 