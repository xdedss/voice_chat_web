
export function pop_dict(object, propertyName) {
    const temp = object[propertyName];
    delete object[propertyName];
    return temp;
}

export function extractDict(object, requiredNames, optionalNames) {
    const res = {};
    for (let name of requiredNames) {
        if (object[name] === undefined) {
            throw 'can not find name in extractDict: ' + name + ' from ' + object;
        }
        res[name] = object[name];
    }
    for (let name of optionalNames) {
        if (object[name] === undefined) {
            continue;
        }
        res[name] = object[name];
    }
    return res;
}

export function extractStandardParams(object, paramsDefs) {
    // paramsDefs: [{id, type, required, (choices)}]
    const res = {};
    for (let entry of paramsDefs) {
        const objVal = object[entry.id];
        if (entry.required) {
            if (objVal === undefined) {
                // requirement not satisfied
                throw '[extractStandardParams] can not find required entry: ' + entry.id + ' from ' + object;
            }
        }
        else {
            if (objVal === undefined) {
                continue; // just ignore it
            }
        }

        // check for enum
        if (entry.type == PARAM_TYPES.ENUM) {
            if (entry.choices === undefined) {
                throw 'paramsDefs does not specify choices for enum ' + entry;
            }
            let enumOk = false;
            for (let enumVal of entry.choices) {
                if (objVal == enumVal) {
                    enumOk = true;
                    break;
                }
            }
            if (!enumOk) {
                throw 'parameter ' + entry.id + ' does not satisfy enunm choices';
            }
        }
        res[entry.id] = objVal;
    }
    return res;
}

export function mapParamNames(object, func) {
    const res = {};
    for (let k in object) {
        const newK = func(k);
        res[newK] = object[k];
    }
    return res;
}

export function removePrefix(s, prefix) {
    if (s.substr(0, prefix.length) == prefix) {
        return s.substr(prefix.length);
    }
    return s;
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export const guid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const PARAM_TYPES = {
    INT: 'int',
    STRING: 'string',
    BOOL: 'bool',
    ENUM: 'enum',
};
