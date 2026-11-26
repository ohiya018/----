const photo = document.getElementById("photo");
const preview = document.getElementById("preview");
const memo = document.getElementById("memo");
const analyze = document.getElementById("analyze");
const status = document.getElementById("status");
const result = document.getElementById("result");
const outlineSection = document.getElementById("outline-section");
const outlineElement = document.getElementById("outline");
const createArticleButton = document.getElementById("create-article");
const writingSection = document.getElementById("writing-section");
const writingArea = document.getElementById("writing-area");
const previewSection = document.getElementById("preview-section");
const articlePreview = document.getElementById("article-preview");
const previewButton = document.getElementById("preview-button");
const articleTitle = document.getElementById("article-title");
const sendWordPressButton = document.getElementById("send-wordpress");
const wordpressStatus = document.getElementById("wordpress-status");

// 写真を選択したとき
photo.addEventListener("change", () => {
    const file = photo.files[0];

    if (file) {
        preview.src = URL.createObjectURL(file);
        status.textContent = "写真を選択しました";
        result.textContent = "";
    }
});

// 送信ボタンを押したとき
analyze.addEventListener("click", async () => {
    const file = photo.files[0];

    if (!file) {
        status.textContent = "先に写真を選択してください";
        return;
    }

    // 写真を送信する準備
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("memo", memo.value);

    status.textContent = "写真を送信しています...";
    analyze.disabled = true;

    try {
        // サーバーへ写真を送信
        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        // サーバーからの返答を文字列として受け取る
        const responseText = await response.text();

        console.log("サーバーの返答:", responseText);
        console.log("ステータスコード:", response.status);

        // JSONに変換する
        let data;

        try {
            data = JSON.parse(responseText);
        } catch (error) {
            throw new Error("サーバーから正しいJSONが返ってきていません。ターミナルを確認してください。");
        }

        if (!response.ok) {
            throw new Error(data.message || "送信に失敗しました");
        }

        if (!response.ok) {
            throw new Error(data.message || "送信に失敗しました");
        }

        // サーバーから返ってきた情報を表示
        status.textContent = data.message;

        console.log(data.json);

        displayAnalysis(data.json);
        // AIが提案した最初のタイトルを初期値にする
        articleTitle.value = data.json.titles[0] || "";
        createOutline(data.json);

    } catch (error) {
        status.textContent = error.message;

    } finally {
        analyze.disabled = false;
    }
});

// 記事構成を作成する
async function createOutline(data) {
    try {
        const response = await fetch("/api/create-outline", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                description: data.description,
                memo: memo.value,
                direction: data.direction,
                titles: data.titles
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        // 記事構成を画面に表示
        displayOutline(result.outline);

    } catch (error) {
        console.error("記事構成エラー:", error);
        status.textContent = "記事構成の作成に失敗しました。";
    }
}


// ==========================
// AI分析結果のカード表示
// ==========================

// HTMLに安全に文字を表示するための処理
function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// コピー機能を作る
function createCopyButton(text) {
    const button = document.createElement("button");
    button.className = "copy-button";
    button.textContent = "コピー";

    const message = document.createElement("p");
    message.className = "copy-message";

    button.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(text);
            message.textContent = "コピーしました！";
        } catch (error) {
            message.textContent = "コピーできませんでした";
        }
    });

    const area = document.createElement("div");
    area.append(button, message);

    return area;
}

// カードを作る
function createAnalysisCard(title, text, copy = true) {
    const card = document.createElement("section");
    card.className = "analysis-card";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const content = document.createElement("p");
    content.textContent = text;

    card.append(heading, content);

    if (copy) {
        card.appendChild(createCopyButton(text));
    }

    return card;
}

// 分析結果を4つの項目に分けて表示
function displayAnalysis(data) {
    result.innerHTML = "";

    const cards = document.createElement("div");
    cards.className = "analysis-cards";

    // 1. カテゴリー
    const categoryCard = document.createElement("section");
    categoryCard.className = "analysis-card";

    const categoryHeading = document.createElement("h3");
    categoryHeading.textContent = "カテゴリー";

    const categoryLabel = document.createElement("span");
    categoryLabel.className = "category-label";
    categoryLabel.textContent = data.category;

    categoryCard.append(categoryHeading, categoryLabel);
    cards.appendChild(categoryCard);

    // 2. 写真から読み取れること
    cards.appendChild(
        createAnalysisCard("写真から読み取れること", data.description)
    );

    // 3. タイトル候補
    const titleCard = document.createElement("section");
    titleCard.className = "analysis-card";

    const titleHeading = document.createElement("h3");
    titleHeading.textContent = "タイトル候補";

    titleCard.appendChild(titleHeading);

    data.titles.forEach((title) => {
        const item = document.createElement("div");
        item.className = "title-item";

        const titleText = document.createElement("p");
        titleText.textContent = title;

        item.appendChild(titleText);
        item.appendChild(createCopyButton(title));

        titleCard.appendChild(item);
    });

    cards.appendChild(titleCard);

    // 4. ブログの方向性
    cards.appendChild(
        createAnalysisCard("ブログの方向性", data.direction)
    );

    result.appendChild(cards);
}

// 記事構成を画面に表示する
function displayOutline(outline) {
    // 前に表示した構成を消す
    outlineElement.innerHTML = "";

    // 見出しを1つずつ表示する
    outline.forEach((item, index) => {
        const section = document.createElement("div");
        section.className = "outline-item";

        // 見出し
        const heading = document.createElement("h3");
        heading.textContent = `${index + 1}. ${item.heading}`;

        // 文章を書くときのヒント
        const hint = document.createElement("p");
        hint.textContent = item.hint;

        section.append(heading, hint);
        outlineElement.appendChild(section);
    });

    // 記事構成のエリアを表示する
    outlineSection.hidden = false;
}

// 記事を書くボタンを押したとき
createArticleButton.addEventListener("click", () => {
    // 入力欄を一度空にする
    writingArea.innerHTML = "";

    // 記事構成をもとに入力欄を作る
    outlineElement.querySelectorAll(".outline-item").forEach((item) => {
        const heading = item.querySelector("h3").textContent;
        const hint = item.querySelector("p").textContent;

        // 入力欄のまとまり
        const section = document.createElement("div");
        section.className = "writing-item";

        // 見出し
        const title = document.createElement("h3");
        title.textContent = heading;

        // 文章を書くヒント
        const guide = document.createElement("p");
        guide.textContent = hint;

        // 文章入力欄
        const textarea = document.createElement("textarea");
        textarea.placeholder = "ここに文章を書いてください";

        section.append(title, guide, textarea);
        writingArea.appendChild(section);
    });

    // 記事を書くエリアを表示
    writingSection.hidden = false;
});

// 記事を確認するボタンを押したとき
previewButton.addEventListener("click", () => {
    // 前のプレビューを消す
    articlePreview.innerHTML = "";
    // 記事タイトルを表示
    const title = document.createElement("h2");
    title.textContent = articleTitle.value || "タイトル未設定";

    articlePreview.appendChild(title);

    // 入力された文章を取得する
    const writingItems = writingArea.querySelectorAll(".writing-item");

    writingItems.forEach((item) => {
        const heading = item.querySelector("h3").textContent;
        const content = item.querySelector("textarea").value;

        // 見出しを作る
        const title = document.createElement("h3");
        title.textContent = heading;

        // 本文を作る
        const paragraph = document.createElement("p");
        paragraph.textContent = content;

        articlePreview.append(title, paragraph);
    });

    // プレビューを表示する
    previewSection.hidden = false;
});

// WordPressに下書き保存する
sendWordPressButton.addEventListener("click", async () => {
    // タイトルを取得
    const title = articleTitle.value;

    // 記事本文をまとめる
    let content = "";

    const writingItems = writingArea.querySelectorAll(".writing-item");

    writingItems.forEach((item) => {
        const heading = item.querySelector("h3").textContent;
        const text = item.querySelector("textarea").value;

        content += `<h2>${escapeHTML(heading)}</h2>`;
        content += `<p>${escapeHTML(text).replace(/\n/g, "<br>")}</p>`;
    });

    if (!title.trim()) {
        wordpressStatus.textContent = "タイトルを入力してください";
        return;
    }

    if (!content.trim()) {
        wordpressStatus.textContent = "記事本文を入力してください";
        return;
    }

    wordpressStatus.textContent = "WordPressに送信しています...";
    sendWordPressButton.disabled = true;

    try {
        const response = await fetch("/api/wordpress-post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "送信に失敗しました");
        }

        wordpressStatus.textContent = data.message;

        console.log("WordPress記事ID:", data.postId);
        console.log("WordPress記事URL:", data.link);

    } catch (error) {
        console.error("WordPress送信エラー:", error);
        wordpressStatus.textContent = error.message;

    } finally {
        sendWordPressButton.disabled = false;
    }
});
