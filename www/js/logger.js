// logger.js - ログ出力機能

const LogLevel = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG'
};

/**
 * ログを出力する
 * @param {string} level - ログレベル (LogLevel)
 * @param {string} message - ログメッセージ
 * @param {object} [data] - 追加データ
 */
function log(level, message, data) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    if (data) {
        console.log(logMessage, data);
    } else {
        console.log(logMessage);
    }

    // エラーの場合はスタックトレースも表示
    if (level === LogLevel.ERROR && data instanceof Error) {
        console.error(data.stack);
    }
}

// グローバルなロガーオブジェクトを提供
const logger = {
    info: (message, data) => log(LogLevel.INFO, message, data),
    warn: (message, data) => log(LogLevel.WARN, message, data),
    error: (message, data) => log(LogLevel.ERROR, message, data),
    debug: (message, data) => log(LogLevel.DEBUG, message, data),
};

logger.info('ロガーが初期化されました。');
