const MapPicker = {
    _instances: {},
    _defaultCenter: { lat: -8.1116, lng: -79.0288 }, 

    isGoogleMapsReady() {
        return typeof google !== 'undefined' && google.maps && google.maps.places;
    },

    /**
     * Dibuja el selector dentro del elemento con id = containerId.
     * opts.fieldPrefix define el nombre de los inputs ocultos generados
     * (ej: "origin" -> origin_lat, origin_lng) y debe coincidir con lo
     * que el backend espera en orderController.js.
     * opts.addressFieldName es el name del input de texto visible que ya
     * existe en el formulario (la dirección); si se pasa, el autocompletado
     * escribe ahí en vez de crear un input nuevo.
     * opts.onPlaceChanged(place) es un callback opcional.
     */
    render(containerId, opts = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const prefix = opts.fieldPrefix || containerId;
        const form = container.closest('form');

        // Si Google Maps no está disponible, degradar a un aviso simple
        // y no romper el formulario (los campos de texto normales siguen
        // funcionando igual, simplemente no habrá lat/lng).
        if (!MapPicker.isGoogleMapsReady()) {
            container.innerHTML = `
                <div class="map-picker-fallback">
                    <i class="fas fa-map-marker-alt"></i>
                    Mapa no disponible. Escribe la dirección manualmente arriba.
                </div>`;
            return;
        }

        container.innerHTML = `
            <div class="map-picker">
                <div class="map-picker-search">
                    <i class="fas fa-search-location"></i>
                    <input type="text" class="form-control map-picker-input" placeholder="Busca una dirección..." autocomplete="off">
                </div>
                <div class="map-picker-canvas" id="${containerId}_canvas"></div>
                <p class="map-picker-hint"><i class="fas fa-hand-pointer"></i> Puedes arrastrar el marcador para ajustar el punto exacto</p>
            </div>
            <input type="hidden" name="${prefix}_lat">
            <input type="hidden" name="${prefix}_lng">
        `;

        const searchInput = container.querySelector('.map-picker-input');
        const latInput = container.querySelector(`[name="${prefix}_lat"]`);
        const lngInput = container.querySelector(`[name="${prefix}_lng"]`);
        const mapDiv = container.querySelector(`#${containerId}_canvas`);

        const center = opts.initialLat && opts.initialLng
            ? { lat: parseFloat(opts.initialLat), lng: parseFloat(opts.initialLng) }
            : MapPicker._defaultCenter;

        const map = new google.maps.Map(mapDiv, {
            center,
            zoom: opts.initialLat ? 16 : 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true
        });

        const marker = new google.maps.Marker({
            map,
            position: center,
            draggable: true
        });

        function setCoords(lat, lng) {
            latInput.value = lat;
            lngInput.value = lng;
        }

        if (opts.initialLat && opts.initialLng) {
            setCoords(opts.initialLat, opts.initialLng);
        }

        marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            setCoords(pos.lat(), pos.lng());
        });
        
        map.addListener('click', (e) => {
            marker.setPosition(e.latLng);
            setCoords(e.latLng.lat(), e.latLng.lng());
        });

        const autocomplete = new google.maps.places.Autocomplete(searchInput, {
            fields: ['geometry', 'formatted_address', 'name']
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) return;

            const loc = place.geometry.location;
            map.setCenter(loc);
            map.setZoom(16);
            marker.setPosition(loc);
            setCoords(loc.lat(), loc.lng());

            if (opts.addressFieldName && form) {
                const addressInput = form.querySelector(`[name="${opts.addressFieldName}"]`);
                if (addressInput) addressInput.value = place.formatted_address || place.name || addressInput.value;
            }

            if (typeof opts.onPlaceChanged === 'function') {
                opts.onPlaceChanged(place);
            }
        });

        // Permite pegar directamente un enlace de Google Maps (o unas
        // coordenadas "lat,lng" copiadas de ahí) en el buscador, en vez de
        // tener que escribir/buscar la dirección de nuevo. Reconoce formatos
        // como:
        //   https://www.google.com/maps/@-8.111,-79.028,15z
        //   https://maps.google.com/?q=-8.111,-79.028
        //   https://www.google.com/maps/place/.../@-8.111,-79.028,17z/...
        //   -8.111, -79.028   (coordenadas sueltas)
        function intentarUbicacionPegada(texto) {
            if (!texto) return false;
            let lat = null, lng = null;

            // Coordenadas sueltas: "lat, lng"
            let match = texto.match(/^\s*(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
            // Dentro de una URL: @lat,lng o ?q=lat,lng o &q=lat,lng o ll=lat,lng
            if (!match) match = texto.match(/[@=](-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);

            if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
            }

            if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return false;
            if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;

            const loc = new google.maps.LatLng(lat, lng);
            map.setCenter(loc);
            map.setZoom(17);
            marker.setPosition(loc);
            setCoords(lat, lng);

            if (typeof google.maps.Geocoder === 'function') {
                new google.maps.Geocoder().geocode({ location: loc }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        searchInput.value = results[0].formatted_address;
                        if (opts.addressFieldName && form) {
                            const addressInput = form.querySelector(`[name="${opts.addressFieldName}"]`);
                            if (addressInput) addressInput.value = results[0].formatted_address;
                        }
                    }
                });
            }

            if (typeof opts.onPlaceChanged === 'function') {
                opts.onPlaceChanged({ geometry: { location: loc }, formatted_address: texto });
            }
            return true;
        }

        searchInput.addEventListener('paste', () => {
            setTimeout(() => intentarUbicacionPegada(searchInput.value), 0);
        });

        if (!opts.initialLat && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    map.setCenter(loc);
                    map.setZoom(15);
                    marker.setPosition(loc);
                    setCoords(loc.lat, loc.lng);
                },
                () => { /* si el usuario deniega el permiso, se queda el centro por defecto */ },
                { timeout: 5000 }
            );
        }

        MapPicker._instances[containerId] = { map, marker };
    },

    /** Útil si necesitas forzar Google Maps a redibujar tras mostrar un modal oculto */
    invalidateSize(containerId) {
        const instance = MapPicker._instances[containerId];
        if (instance) google.maps.event.trigger(instance.map, 'resize');
    },

    /** Genera un enlace de Google Maps a partir de lat/lng, para compartir por WhatsApp */
    buildMapsLink(lat, lng) {
        if (!lat || !lng) return null;
        return `https://www.google.com/maps?q=${lat},${lng}`;
    }
};

