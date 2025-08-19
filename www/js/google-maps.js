// google-maps.js - Google Maps Platform API関連の処理

// google-maps.js - Google Maps Platform API関連の処理

// グローバル変数
let map;
let placesService;
let directionsService;
let directionsRenderer;
let currentMarker;

/**
 * Google Maps APIスクリプトを動的に読み込む
 * @param {string} apiKey - Google Maps Platform APIキー
 */
function loadGoogleMapsAPI(apiKey) {
    logger.info('Google Maps APIの読み込みを開始します...');

    if (window.google && window.google.maps) {
        logger.info('Google Maps APIは既に読み込まれています。');
        onApiLoaded();
        return;
    }

    const script = document.createElement('script');
    // `directions` ライブラリを追加
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,directions&callback=onApiLoaded`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
        logger.error('Google Maps APIの読み込みに失敗しました。');
        document.body.dispatchEvent(new Event('google-maps-api-error'));
    };

    window.onApiLoaded = onApiLoaded;
    document.head.appendChild(script);
}

/**
 * API読み込み完了後に呼ばれるコールバック関数
 */
function onApiLoaded() {
    logger.info('Google Maps APIの読み込みが完了しました。');
    initMap(document.getElementById('map'));
    document.body.dispatchEvent(new Event('google-maps-api-ready'));
}

/**
 * 地図と関連サービスを初期化する
 * @param {HTMLElement} mapElement - 地図を表示するHTML要素
 */
function initMap(mapElement) {
    logger.info('地図と関連サービスの初期化を開始します...');
    const defaultCenter = { lat: 35.681236, lng: 139.767125 }; // 東京駅
    map = new google.maps.Map(mapElement, {
        center: defaultCenter,
        zoom: 15,
        disableDefaultUI: true,
    });
    placesService = new google.maps.places.PlacesService(map);
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true, // ルートのマーカーは自前で制御するため非表示
    });
    logger.info('地図と関連サービスの初期化が完了しました。');
}

/**
 * 表示をクリアする（マーカーとルート）
 */
function clearMapDisplay() {
    if (currentMarker) {
        currentMarker.setMap(null);
    }
    if (directionsRenderer) {
        directionsRenderer.setDirections(null);
    }
}

/**
 * 周辺の場所を検索する
 * @param {object} location - 検索中心地の緯度経度 { lat, lng }
 * @param {string} type - 検索する場所のタイプ
 * @param {number} radius - 検索範囲（メートル）
 * @returns {Promise<Array>} - 検索結果の配列を返すPromise
 */
function findNearbyPlaces(location, type = 'cafe', radius = 1000) {
    return new Promise((resolve, reject) => {
        logger.info('周辺の場所を検索します。', { location, type, radius });
        if (!placesService) return reject(new Error('PlacesServiceが初期化されていません。'));

        const request = {
            location: new google.maps.LatLng(location.lat, location.lng),
            radius: radius,
            type: [type],
            language: 'ja'
        };

        placesService.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK || status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                resolve(results || []);
            } else {
                logger.error('場所の検索に失敗しました。', { status });
                reject(new Error(`場所の検索に失敗しました: ${status}`));
            }
        });
    });
}

/**
 * 地図にマーカーを表示する
 * @param {object} location - 中心の緯度経度 { lat, lng }
 * @param {string} title - マーカーのタイトル
 */
function updateMapLocation(location, title) {
    if (!map) return;
    clearMapDisplay();
    const newCenter = new google.maps.LatLng(location.lat, location.lng);
    map.setCenter(newCenter);
    map.setZoom(16);

    currentMarker = new google.maps.Marker({
        position: newCenter,
        map: map,
        title: title,
        animation: google.maps.Animation.DROP
    });
    logger.info(`マーカーを追加しました: ${title}`);
}

/**
 * 指定した２点間のルートを検索し、地図に表示する
 * @param {object} origin - 出発地の緯度経度 { lat, lng }
 * @param {google.maps.LatLng} destination - 目的地のLatLngオブジェクト
 */
function displayRoute(origin, destination) {
    if (!map) return;
    clearMapDisplay();
    logger.info('ルートを検索します...', { origin, destination: destination.toJSON() });

    directionsService.route({
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: destination,
        travelMode: google.maps.TravelMode.WALKING
    }, (result, status) => {
        if (status === 'OK') {
            logger.info('ルートの取得に成功しました。');
            directionsRenderer.setDirections(result);
        } else {
            logger.error('ルートの取得に失敗しました。', { status });
            // ルート取得失敗時は目的地にマーカーを立てる
            updateMapLocation(destination.toJSON(), '目的地');
        }
    });
}
