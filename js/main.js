// main.js - アプリケーションのメインロジック

// --- 設定 ---
// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// ここにあなたのGoogle Maps APIキーを入力してください
const API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
// --- 設定ここまで ---


// DOM要素の取得
const findPlaceBtn = document.getElementById('find-place-btn');
const placeNameEl = document.getElementById('place-name');
const placeInfoEl = document.getElementById('place-info');
const mapEl = document.getElementById('map');
const categorySelector = document.getElementById('category-selector');

// アプリケーションの状態
let selectedCategory = 'cafe'; // デフォルトのカテゴリ
let selectedCategoryJA = 'カフェ'; // デフォルトのカテゴリ（日本語）


/**
 * UIの状態を更新する
 * @param {string} name - 場所の名前
 * @param {string} info - 場所の情報
 * @param {boolean} [loading=false] - 読み込み中の状態か
 */
function updateUI(name, info, loading = false) {
    placeNameEl.textContent = name;
    placeInfoEl.textContent = info;
    const isLoading = loading || findPlaceBtn.disabled;
    findPlaceBtn.disabled = isLoading;
    categorySelector.querySelectorAll('.category-btn').forEach(btn => btn.disabled = isLoading);
    findPlaceBtn.textContent = loading ? '検索中...' : '近くの場所を探す';
}


/**
 * ランダムな場所を見つけて表示する
 */
async function findRandomPlace() {
    logger.info(`場所の検索を開始します... カテゴリ: ${selectedCategory}`);
    updateUI('検索中...', '現在地を取得しています...', true);

    if (!navigator.geolocation) {
        logger.error('お使いのブラウザは位置情報取得に対応していません。');
        updateUI('エラー', 'お使いのブラウザは位置情報取得に対応していません。', false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            logger.info('現在地を取得しました。', currentLocation);
            updateUI('検索中...', `周辺の${selectedCategoryJA}を探しています...`, true);

            try {
                const places = await findNearbyPlaces(currentLocation, selectedCategory, 1000);
                if (places.length === 0) {
                    logger.warn(`周辺に該当する場所(${selectedCategory})が見つかりませんでした。`);
                    updateUI('残念！', `近くに${selectedCategoryJA}が見つかりませんでした。`, false);
                    updateMapLocation(currentLocation, '現在地');
                    return;
                }

                const randomPlace = places[Math.floor(Math.random() * places.length)];
                logger.info('提案する場所を決定しました。', randomPlace);

                updateUI(randomPlace.name, randomPlace.vicinity, false);
                // 地図にルートを表示
                displayRoute(currentLocation, randomPlace.geometry.location);

            } catch (error) {
                logger.error('場所の検索中にエラーが発生しました。', error);
                updateUI('エラー', '場所の検索に失敗しました。', false);
            }
        },
        (error) => {
            logger.error('位置情報の取得に失敗しました。', error);
            const message = error.code === 1 ? '位置情報の利用が許可されていません。' : '位置情報が取得できませんでした。';
            updateUI('エラー', message, false);
        }
    );
}

/**
 * カテゴリ選択のハンドラ
 * @param {MouseEvent} event
 */
function handleCategorySelect(event) {
    const clickedButton = event.target.closest('.category-btn');
    if (!clickedButton || clickedButton.disabled) return;

    selectedCategory = clickedButton.dataset.category;
    selectedCategoryJA = clickedButton.dataset.categoryJa;
    logger.info(`カテゴリが変更されました: ${selectedCategoryJA}`);

    categorySelector.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    clickedButton.classList.add('selected');
}


// イベントリスナーの設定
findPlaceBtn.addEventListener('click', findRandomPlace);
categorySelector.addEventListener('click', handleCategorySelect);


// Google Maps APIの準備完了イベント
document.body.addEventListener('google-maps-api-ready', () => {
    logger.info('APIの準備が完了しました。検索ボタンを有効にします。');
    findPlaceBtn.disabled = false;
    updateUI('準備完了！', 'カテゴリを選んで、散歩先を探しましょう。');
});

// Google Maps APIの読み込み失敗イベント
document.body.addEventListener('google-maps-api-error', () => {
    logger.error('APIの読み込みに失敗しました。');
    updateUI('エラー', '地図サービスの読み込みに失敗しました。');
    findPlaceBtn.disabled = true;
});


/**
 * アプリケーションの初期化
 */
function init() {
    logger.info('アプリケーションを初期化しています...');
    updateUI('ようこそ！', '地図サービスを読み込んでいます...', true);

    if (API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY' || !API_KEY) {
        logger.warn('Google Maps APIキーが設定されていません。');
        updateUI('APIキーが必要です', 'js/main.jsにAPIキーを設定してください。');
    } else {
        loadGoogleMapsAPI(API_KEY);
    }
    logger.info('アプリケーションが初期化されました。');
}

// 初期化関数を呼び出し
init();
