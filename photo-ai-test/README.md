# 技術実験
進級展制作においてアプリを制作するにあたって必要な技術の実験や確かめをする

## HTMLやJavaScriptでの技術コード
<主なコード説明>
/* 基本構造 */
<meta name="viewport" content="width=device-width, initial-scale=1.0">
スマホ対応に重要なコード
- width=device-width
ページの幅を端末の画面幅に合わせる
- initial-scale=1.0
最初の表示倍率を100%にする

/* 写真選択部分 */
<h1>写真を選択</h1>
<input type="file" id="photo" accept="image/*">
inputはユーザーが入力・選択するための部品
type="file"にすることで、ファイルを選択する機能になる
PCではファイル選択画面、スマホでは端末やブラウザに応じて写真やファイルを選ぶ画面が開く

- image/* → 画像ファイル全般
- image/png → PNG画像
- image/jpeg → JPEG画像
選択できるファイルの種類を指定するもの
今回は画像全般を選択できるようにしている

/* JavaScript */
const photo = document.getElementById("photo");
const preview = document.getElementById("preview");
- photo → 写真を選択する入力部品
- preview → 写真を表示する画像部品
をそれぞれ変数として扱っている

photo.addEventListener("change", () => {
  ...
});
写真選択欄で新しい写真を選んだときに発生
1. 写真選択ボタンを押す
2. スマホの写真一覧が開く
3. 写真を選ぶ
4. 選択内容が変わる
5. JavaScriptの処理が始まる
