const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendSigningRequest = async (to, documentTitle, signLink) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Document Signing Request',
        html: `
            <h1>Document Signing Request</h1>
            <p>You have been requested to sign the document: ${documentTitle}</p>
            <p>Click here to view and sign: <a href="${signLink}">${signLink}</a></p>
        `
    };
    return await transporter.sendMail(mailOptions);
};

const sendSigningConfirmation = async (to, documentTitle) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Document Signed Successfully',
        html: `
            <h1>Document Signed</h1>
            <p>The document "${documentTitle}" has been signed successfully.</p>
        `
    };
    return await transporter.sendMail(mailOptions);
};

const sendDocumentCompleted = async (to, documentTitle) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Document Completed',
        html: `
            <h1>Document Completed</h1>
            <p>All parties have signed the document: "${documentTitle}"</p>
        `
    };
    return await transporter.sendMail(mailOptions);
};

module.exports = {
    sendSigningRequest,
    sendSigningConfirmation,
    sendDocumentCompleted
};