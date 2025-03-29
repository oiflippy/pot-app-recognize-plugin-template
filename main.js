async function recognize(base64, lang, options) {
    const { config, utils } = options;
    const { tauriFetch: fetch } = utils;
    let { model = "gpt-4o", customModel, apiKey, requestPath, customPrompt } = config;

    // 如果选择了自定义模型，使用自定义模型名称
    if (model === "custom" && customModel) {
        model = customModel;
    }

    // 处理请求路径
    if (!requestPath) {
        requestPath = "https://api.openai.com/v1/chat/completions";
    }
    if (!/https?:\/\/.+/.test(requestPath)) {
        requestPath = `https://${requestPath}`;
    }
    if (requestPath.endsWith('/')) {
        requestPath = requestPath.slice(0, -1);
    }

    // 处理自定义 Prompt
    if (!customPrompt) {
        customPrompt = model.includes("minimax") 
            ? "MM智能助理是一款由MiniMax自研的，没有调用其他产品的接口的大型语言模型。MiniMax是一家中国科技公司，一直致力于进行大模型相关的研究。"
            : "只输出文字识别内容，不要说'这张照片展示了'，不要说'有什么我可以帮助你的吗？无论是问题解答、信息查询还是其他任何事情，请随时告诉我。'";
    } else {
        customPrompt = customPrompt.replaceAll("$lang", lang);
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    }

    const body = {
        model,
        messages: [
            {
                "role": "system",
                "content": customPrompt,
                "name": model.includes("minimax") ? "MM智能助理" : undefined
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": `data:image/png;base64,${base64}`,
                            "detail": "high"
                        },
                    },
                ],
            }
        ]
    }

    let res = await fetch(requestPath, {
        method: 'POST',
        url: requestPath,
        headers: headers,
        body: {
            type: "Json",
            payload: body
        }
    });

    if (res.ok) {
        let result = res.data;
        return result.choices[0].message.content;
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}