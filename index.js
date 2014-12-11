module.exports = function (schema, options) {
    var message = 'Error, expected `{PATH}` to be unique. Value: `{VALUE}`';
    if (options && options.message) {
        message = options.message;
    }

    var indexes = schema.indexes(); // [ [{paths}, {options}], ...]
    indexes = Object.keys(indexes).reduce(function (p, key) {
        Object.keys(indexes[key][0]).forEach(function (path) {
            p[path] = p[path] || {};
            Object.keys(indexes[key][1]).forEach(function (optionKey) {
                p[path][optionKey] = indexes[key][1][optionKey];
            });
        });
        return p;
    }, {}); // transform into { path: {options} }

    schema.eachPath(function (path, schemaType) {
        if (indexes[path].unique) {
            var validator = buildUniqueValidator(path);
            message = buildMessage(schemaType.options.unique || indexes[path].unique, message);
            schemaType.validate(validator, message);
        }
    });
};

function buildMessage(uniqueOption, message){
    return typeof uniqueOption === 'string' ? uniqueOption : message;
}

function buildUniqueValidator(path) {
    return function (value, respond) {
        var model = this.model(this.constructor.modelName);
        var query = buildQuery(path, value, this._id);
        var callback = buildValidationCallback(respond);
        model.findOne(query, callback);
    };
}

function buildQuery(field, value, id) {
    var query = { $and: [] };
    var target = {};
    target[field] = value;
    query.$and.push({ _id: { $ne: id } });
    query.$and.push(target);
    return query;
}

function buildValidationCallback(respond) {
    return function (err, document) {
        respond(!document);
    };
}
