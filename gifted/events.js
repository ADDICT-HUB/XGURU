// gift/events.js

const commands = [];

/**
 * Function to register new commands
 * @param {Object} obj - Command configuration
 * @param {Function} obj.function - The logic to execute
 */
function cmd(obj, func) {
    const command = {
        pattern: obj.pattern,
        alias: obj.alias || [],
        category: obj.category || 'misc',
        desc: obj.desc || '',
        use: obj.use || '',
        filename: obj.filename || 'default.js',
        function: func
    };
    commands.push(command);
    return command;
}

module.exports = {
    cmd,
    addCommand: cmd,
    commands
};
