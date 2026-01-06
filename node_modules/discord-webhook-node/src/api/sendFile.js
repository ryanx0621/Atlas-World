const FormData = require('form-data');
const fs = require('fs');

module.exports = (hookURL, file, { username, avatar_url }) => new Promise((resolve, reject) => {
    const form = new FormData();

    if (username){
        form.append('username', username);
    };

    if (avatar_url){
        form.append('avatar_url', avatar_url);
    };

    form.append('file', fs.createReadStream(file));
    
    form.submit(hookURL, (error, response) => {
        if (error) reject(error);
        else resolve(response);
    });
});
