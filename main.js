/**
 * 异步获取模型列表
 * @param {Object} config - 配置对象，包含API URL和API密钥
 * @param {Object} utils - 工具对象，包含用于API请求的fetch函数
 * @returns {Promise<Object>} - 返回一个Promise，解析为模型ID和标签的对象
 */
async function getModels(config, utils) {
    // 从配置对象中解构出API URL和API密钥
    const { api_url, apikey } = config;
    // 从工具对象中解构出fetch函数
    const { tauriFetch } = utils;
    
    try {
        // 发起GET请求以获取模型列表
        const response = await tauriFetch(`${api_url}/models`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apikey}`,
                "Content-Type": "application/json"
            },
            timeout: 5000
        });

        // 如果响应状态不是成功，抛出错误
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status}`);
        }

        // 从响应数据中提取模型列表
        const { data } = response.data;
        // 将模型列表映射为具有value和label属性的对象数组
        const models = data.map(model => ({
            value: model.id,
            label: model.id
        }));

        // 将模型数组转换为对象，其中模型ID既作为键又作为值
        return models.reduce((acc, model) => {
            acc[model.value] = model.label;
            return acc;
        }, {});
    } catch (error) {
        // 捕获错误并记录到控制台
        console.error('Failed to fetch models:', error);
        // 返回一个空对象以表示失败的请求
        return {};
    }
}

/**
 * 异步函数，用于通过指定的语言模型识别图像中的文本。
 * 
 * @param {string} base64 - 图像的base64编码字符串。
 * @param {string} lang - 图像中文本的语言，当前函数体中未使用，但可能为未来扩展预留。
 * @param {Object} options - 包含配置和工具函数的对象。
 * @returns {Promise<string>} - 返回一个解析为识别文本的Promise。
 * @throws {Error} - 如果API请求失败或缺少必要的配置项，则抛出错误。
 */
async function recognize(base64, lang, options) {
    // 从options中解构出必要的组件
    const { config, utils } = options;
    const { tauriFetch } = utils;
    const { api_url, apikey, model } = config;

    // 验证必要参数
    if (!api_url || !apikey || !model) {
        throw new Error('缺少必要的配置项：api_url、apikey 或 model');
    }

    try {
        // 发起API请求
        const response = await tauriFetch(`${api_url}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apikey}`,
                "Content-Type": "application/json"
            },
            body: {
                type: "Json",
                payload: {
                    model: model,
                    messages: [
                        {
                            role: "user",
                            content: `从该图像中提取文本: ${base64}`
                        }
                    ],
                    max_tokens: 1000
                }
            },
            timeout: 30000
        });

        // 处理API响应
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const { choices } = response.data;
        if (!choices || choices.length === 0) {
            throw new Error('模型未返回任何结果');
        }

        // 返回识别的文本
        return choices[0].message.content.trim();
    } catch (error) {
        // 记录错误并抛出自定义错误
        console.error('OCR请求失败:', error);
        throw `请求失败: ${error.message}`;
    }
}

export default { recognize, getModels };