const { formatColor } = require('../utils');

module.exports = class MessageBuilder {
    constructor(){
        this.payload = {
            embeds: [{fields: []}]
        };
    };

    getJSON(){
        return this.payload;
    };

    setText(text){
        this.payload.content = text;

        return this;
    }

    setAuthor(author, authorImage, authorUrl){
        this.payload.embeds[0].author = {};
        this.payload.embeds[0].author.name = author;
        this.payload.embeds[0].author.url = authorUrl;   
        this.payload.embeds[0].author.icon_url = authorImage;  
         
        return this;
    };

    setTitle(title){
        this.payload.embeds[0].title = title;

        return this;
    };

    setURL(url){
        this.payload.embeds[0].url = url;

        return this;
    };

    setThumbnail(thumbnail){
        this.payload.embeds[0].thumbnail = {};
        this.payload.embeds[0].thumbnail.url = thumbnail;

        return this;
    };

    setImage(image){
        this.payload.embeds[0].image = {};
        this.payload.embeds[0].image.url = image;

        return this;
    };

    setTimestamp(date){
        if (date){
            this.payload.embeds[0].timestamp = date;
        }
        else {
            this.payload.embeds[0].timestamp = new Date();
        };

        return this;
    };

    setColor(color){
        this.payload.embeds[0].color = formatColor(color);

        return this;
    };

    setDescription(description){
        this.payload.embeds[0].description = description;

        return this;
    };

    addField(fieldName, fieldValue, inline){
        this.payload.embeds[0].fields.push({
            name: fieldName,
            value: fieldValue,
            inline: inline
        });

        return this;
    };

    setFooter(footer, footerImage){
        this.payload.embeds[0].footer = {};
        this.payload.embeds[0].footer.icon_url = footerImage;
        this.payload.embeds[0].footer.text = footer;

        return this;
    };
};