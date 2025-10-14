// Utilities/emailConfig.js
// Common email configuration to prevent spam

const getEmailConfig = (to, subject, html, text) => {
  return {
    to,
    from: {
      email: process.env.SENDGRID_VERIFIED_SENDER,
      name: "PawProject - Pet Adoption"
    },
    replyTo: {
      email: process.env.SENDGRID_VERIFIED_SENDER,
      name: "PawProject Support"
    },
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
    trackingSettings: {
      clickTracking: { enable: false },
      openTracking: { enable: false },
      subscriptionTracking: { enable: false }
    },
    mailSettings: {
      bypassListManagement: { enable: false },
      footer: { enable: false },
      sandboxMode: { enable: false }
    },
    categories: ["PawProject", "Transactional"],
    customArgs: {
      app: "PawProject",
      environment: process.env.NODE_ENV || "production"
    },
    // Anti-spam headers
    headers: {
      'X-Entity-Ref-ID': `pawproject-${Date.now()}`,
      'X-Mailer': 'PawProject Notification System',
      'Precedence': 'bulk',
      'List-Unsubscribe': `<mailto:${process.env.SENDGRID_VERIFIED_SENDER}?subject=unsubscribe>`
    }
  };
};

module.exports = { getEmailConfig };
