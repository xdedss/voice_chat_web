
const ClassRegistry = {};

// Registration function
// function register(key) {
//     return function (ClassConstructor) {
//         if (ClassRegistry[key] === undefined) {
//             ClassRegistry[key] = [];
//         }
//         ClassRegistry[key].push(ClassConstructor);
//         return ClassConstructor;
//     };
// }


function register(key, ClassConstructor) {
    const name = ClassConstructor.name;
    if (ClassRegistry[key] === undefined) {
        ClassRegistry[key] = [];
    }
    ClassRegistry[key].push({
        name: name,
        c: ClassConstructor,
    });
    return ClassConstructor;
}

export function registerInputProvider(ClassConstructor) {
    return register('InputProvider', ClassConstructor);
}

export function registerChatProvider(ClassConstructor) {
    return register('ChatProvider', ClassConstructor);
}

export function registerOutputProvider(ClassConstructor) {
    return register('OutputProvider', ClassConstructor);
}

export function getInputProviders() {
    return ClassRegistry['InputProvider'] || [];
}

export function getChatProviders() {
    return ClassRegistry['ChatProvider'] || [];
}

export function getOutputProviders() {
    return ClassRegistry['OutputProvider'] || [];
}

