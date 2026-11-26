require("dotenv").config();

const express = require("express");
const multer = require("multer");

const app = express();
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

app.use(express.static("public"));

app.post("/upload", upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "写真が送信されていません"
            });
        }

        if (!req.file.mimetype.startsWith("image/")) {
            return res.status(400).json({
                message: "画像ファイルを選択してください"
            });
        }

        // 写真をBase64形式に変換
        const base64 = req.file.buffer.toString("base64");
        // フォームから送られてきたメモを取得
        const memo = req.body.memo || "";
        console.log("受け取ったメモ:", memo);

        // Ollamaに写真分析を依頼
        const ollamaResponse = await fetch("http://127.0.0.1:11434/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gemma4:e4b",
                stream: false,

                // AIの返答をJSON形式に指定
                format: {
                    type: "object",
                    properties: {
                        category: {
                            type: "string"
                        },
                        description: {
                            type: "string"
                        },
                        titles: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        },
                        direction: {
                            type: "string"
                        }
                    },
                    required: [
                        "category",
                        "description",
                        "titles",
                        "direction"
                    ]
                },

                options: {
                    temperature: 0.3
                },

                messages: [
                    {
                        role: "user",

                        content: `あなたは、ユーザー自身がブログを書くためのサポートAIです。

写真とユーザーのメモを使って、ブログの題材や書き方を提案してください。

【ユーザーのメモ】
${memo.trim() || "メモはありません"}

【それぞれの情報の役割】
・写真とメモの両方をブログの提案に反映してください。
・写真から読み取れる情報は、場所や物、状況などの説明に活用してください。
・メモから読み取れる情報は、ユーザー自身の体験や感想として活用してください。
・写真とメモを関連付けられる場合は、自然に組み合わせてください。
・関連付けられない場合は、無理に結び付けず、それぞれの情報を活用してください。
・写真やメモに書かれていない事実、行動、感情などを勝手に作らないでください。
・写真から読み取れる事実と、ユーザー本人の感想を区別してください。
・写真だけでは判断できない雰囲気や感情を推測しないでください。
・メモに書かれていない体験や感情は、事実として扱わず質問で確認してください。
・ユーザーが答えやすい具体的な質問を2〜3個提案してください。
・写真とメモの両方を使いますが、無理に関連付けないでください。

以下の4項目をJSON形式で出力してください。

- category:
写真の内容を以下のどちらかに分類してください。
「CODE｜制作・学習」または「DAILY｜日常・体験」

- description:
写真に写っているものや、客観的に読み取れる状況・特徴を説明してください。
ユーザーのメモの内容を混ぜず、写真の説明に専念してください。

・titles：
写真とメモの両方を参考に、異なる切り口のタイトルを3つ提案してください。

・direction：
写真の内容とユーザーのメモを組み合わせて、記事の方向性を提案してください。
ユーザーが自分で文章を書き始められるよう、具体的な質問や書く内容のヒントも含めてください。

【重要な注意事項】
・メモが入力されている場合、写真よりもメモの内容を優先してください。
・メモが短くても、その内容を勝手に別の話題へ広げないでください。
・メモにない経験、行動、感情、考えを作らないでください。
・写真から分からない背景や目的を推測して断定しないでください。
・メモと写真の関連性が分からない場合、無理に関連付けないでください。
・ユーザー自身がブログを書くための補助に徹してください。
・JSON以外の文章は出力しないでください。`,
                        images: [base64]

                    }
                ]
            })
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama APIエラー: ${ollamaResponse.status}`);
        }

        const data = await ollamaResponse.json();

        // AIの返答をJSONとして読み込む
        const analysis = JSON.parse(data.message.content);

        // 文章形式の分析結果も作成（従来表示用）
        const formattedText = `【カテゴリー】
${analysis.category}

【写真から読み取れること】
${analysis.description}

【タイトル候補】
${analysis.titles.join("\n")}

【ブログの方向性】
${analysis.direction}`;

        // 分析結果をブラウザに返す
        res.json({
            message: "AIの分析が完了しました！",
            result: formattedText,
            json: analysis
        });

    } catch (error) {
        console.error("AI分析エラー:", error);

        res.status(500).json({
            message: "AIによる写真分析に失敗しました"
        });
    }
});

// 記事構成を作成するAPI
app.post("/api/create-outline", async (req, res) => {
    try {
        console.log("受け取ったデータ:", req.body);
        console.log("Content-Type:", req.headers["content-type"]);

        const { description, memo, direction, titles } = req.body || {};

        const ollamaResponse = await fetch("http://127.0.0.1:11434/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gemma4:e4b",
                stream: false,
                format: {
                    type: "object",
                    properties: {
                        outline: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    heading: { type: "string" },
                                    hint: { type: "string" }
                                },
                                required: ["heading", "hint"]
                            }
                        }
                    },
                    required: ["outline"]
                },
                options: {
                    temperature: 0.3
                },
                messages: [
                    {
                        role: "user",
                        content: `
あなたはブログ記事の構成を考えるサポートAIです。

以下の情報を参考に、ブログ記事の構成を3つ程度提案してください。

【写真の説明】
${description}

【ユーザーのメモ】
${memo}

【ブログの方向性】
${direction}

【タイトル候補】
${(titles || []).join("、")}

ルール：
・写真とメモの両方を活用してください。
・ユーザー自身が文章を書くための見出しを作ってください。
・各見出しに、何を書けばよいか短いヒントを付けてください。
・メモにない体験や感情を勝手に作らないでください。
・本文そのものは作らないでください。
・見出しは3つ程度にしてください。
・JSON形式だけで回答してください。
`
                    }
                ]
            })
        });

        const data = await ollamaResponse.json();

        const outline = JSON.parse(data.message.content);

        res.json({
            message: "記事構成を作成しました！",
            outline: outline.outline
        });

    } catch (error) {
        console.error("記事構成エラー:", error);

        res.status(500).json({
            message: "記事構成の作成に失敗しました。"
        });
    }
});

// WordPressとの接続テスト
app.get("/api/wordpress-test", async (req, res) => {
    try {
        const username = process.env.WP_USERNAME;
        const password = process.env.WP_APP_PASSWORD;

        // ユーザー名とパスワードを認証用に変換
        const auth = Buffer.from(`${username}:${password}`).toString("base64");

        // WordPressに接続
        const response = await fetch(
            `${process.env.WP_URL}/wp-json/wp/v2/users/me`,
            {
                headers: {
                    Authorization: `Basic ${auth}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "認証に失敗しました");
        }

        res.json({
            message: "WordPressに接続できました！",
            username: data.name
        });

    } catch (error) {
        console.error("WordPress接続エラー:", error);

        res.status(500).json({
            message: "WordPressに接続できませんでした。"
        });
    }
});

// WordPressに記事を下書き保存するAPI
app.post("/api/wordpress-post", async (req, res) => {
    try {
        const { title, content } = req.body;

        // WordPressの認証情報
        const username = process.env.WP_USERNAME;
        const password = process.env.WP_APP_PASSWORD;

        const auth = Buffer
            .from(`${username}:${password}`)
            .toString("base64");

        // WordPressに記事を送信
        const response = await fetch(
            `${process.env.WP_URL}/wp-json/wp/v2/posts`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${auth}`
                },
                body: JSON.stringify({
                    title: title,
                    content: content,
                    status: "draft"
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "記事の保存に失敗しました");
        }

        res.json({
            message: "WordPressに下書き保存しました！",
            postId: data.id,
            link: data.link
        });

    } catch (error) {
        console.error("下書き保存エラー:", error);

        res.status(500).json({
            message: "WordPressへの保存に失敗しました。"
        });
    }
});

app.listen(3000, () => {
    console.log("http://localhost:3000 で起動しました");
});
