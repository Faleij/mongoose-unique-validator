module.exports = function(schema, options) {
    var message = 'Error, expected `{PATH}` to be unique. Value: `{VALUE}`';
    if (options && options.message) {
        message = options.message;
    }

    var indexes = schema.indexes(); // [ [{paths}, {options}], ...]
    
    indexes.forEach(function (indexPair) {
        if (indexPair[1].unique) {
            var validator = buildUniqueValidator(indexPair[0]);
            var path = Object.keys(indexPair[0])[0];
            schema.path(path).validate(validator, buildMessage(indexPair[1].unique, message)); // set validator on only first path
        }
    });
};

function buildMessage(uniqueOption, message) {
    return typeof uniqueOption === 'string' ? uniqueOption : message;
}

function buildUniqueValidator(paths) {
    return function(value, respond) {
        var model = this.model(this.constructor.modelName);
        var query = buildQuery.call(this, paths, value, this._id);
        var callback = buildValidationCallback(respond);
        model.findOne(query, callback);
    };
}

function buildQuery(fields, value, id) {
    var query = {
        $and: []
    };
    var target = {};
    Object.keys(fields).forEach(function (field) {
        target[field] = this.get(field);
    }.bind(this));
    query.$and.push({
        _id: {
            $ne: id
        }
    });
    query.$and.push(target);
    return query;
}

function buildValidationCallback(respond) {
    return function(err, document) {
        respond(!document);
    };
}