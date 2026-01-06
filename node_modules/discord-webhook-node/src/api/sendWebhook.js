const fetch = require('node-fetch');

module.exports = (hookURL, payload) => new Promise((resolve, reject) => {
    fetch(hookURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(res => resolve(res))
    .catch(err => reject(err));
});
