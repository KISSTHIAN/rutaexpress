const MapPicker = {
    _instances: {},

    _defaultCenter: { lat: -5.1945, lng: -80.6328 },
    _defaultZoom: 13,

    isGoogleMapsReady() {
        return typeof google !== 'undefined' && google.maps && google.maps.places;
    },

    render(containerId, opts = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const prefix = opts.fieldPrefix || containerId;
        const form = container.closest('form');

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
                <div class="map-picker-actions">
                    <button type="button" class="btn btn-secondary btn-sm map-picker-gps-btn">
                        <i class="fas fa-location-arrow"></i> Usar mi ubicación actual
                    </button>
                    <button type="button" class="btn btn-link btn-sm map-picker-toggle-btn">
                        <i class="fas fa-map"></i> Abrir mapa para ajustar el punto
                    </button>
                </div>
                <div class="map-picker-canvas-wrapper" id="${containerId}_wrapper" style="display:none">
                    <div class="map-picker-canvas" id="${containerId}_canvas"></div>
                    <p class="map-picker-hint"><i class="fas fa-hand-pointer"></i> Puedes arrastrar el marcador para ajustar el punto exacto</p>
                </div>
            </div>
            <input type="hidden" name="${prefix}_lat">
            <input type="hidden" name="${prefix}_lng">
        `;

        const searchInput = container.querySelector('.map-picker-input');
        const latInput = container.querySelector(`[name="${prefix}_lat"]`);
        const lngInput = container.querySelector(`[name="${prefix}_lng"]`);
        const mapWrapper = container.querySelector(`#${containerId}_wrapper`);
        const mapDiv = container.querySelector(`#${containerId}_canvas`);
        const gpsBtn = container.querySelector('.map-picker-gps-btn');
        const toggleBtn = container.querySelector('.map-picker-toggle-btn');

        const center = opts.initialLat && opts.initialLng
            ? { lat: parseFloat(opts.initialLat), lng: parseFloat(opts.initialLng) }
            : MapPicker._defaultCenter;

        function setCoords(lat, lng) {
            latInput.value = lat;
            lngInput.value = lng;
        }

        if (opts.initialLat && opts.initialLng) {
            setCoords(opts.initialLat, opts.initialLng);
        }

        let mapInstance = null;
        let markerInstance = null;

        function estaFueraDePiura(lat, lng) {
            return lat < -5.90 || lat > -4.05 || lng < -81.35 || lng > -79.20;
        }

        function ensureMapCreated(atLocation) {
            if (mapInstance) return mapInstance;

            mapInstance = new google.maps.Map(mapDiv, {
                center: atLocation || center,
                zoom: atLocation ? 16 : MapPicker._defaultZoom,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true
            });

            markerInstance = new google.maps.Marker({
                map: mapInstance,
                position: atLocation || center,
                draggable: true
            });

            markerInstance.addListener('dragend', () => {
                const pos = markerInstance.getPosition();
                setCoords(pos.lat(), pos.lng());
            });

            mapInstance.addListener('click', (e) => {
                markerInstance.setPosition(e.latLng);
                setCoords(e.latLng.lat(), e.latLng.lng());
            });

            MapPicker._instances[containerId] = { map: mapInstance, marker: markerInstance };
            return mapInstance;
        }

        function openMap(atLocation) {
            mapWrapper.style.display = '';
            ensureMapCreated(atLocation);
            if (atLocation && mapInstance) {
                mapInstance.setCenter(atLocation);
                mapInstance.setZoom(16);
                markerInstance.setPosition(atLocation);
            }

            setTimeout(() => google.maps.event.trigger(mapInstance, 'resize'), 50);
        }

        toggleBtn.addEventListener('click', () => {
            const isHidden = mapWrapper.style.display === 'none';
            if (isHidden) {
                openMap();
                toggleBtn.innerHTML = '<i class="fas fa-map"></i> Ocultar mapa';
            } else {
                mapWrapper.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fas fa-map"></i> Abrir mapa para ajustar el punto';
            }
        });

        gpsBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                showToast('Tu navegador no permite obtener la ubicación actual.', 'error');
                return;
            }
            gpsBtn.disabled = true;
            gpsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obteniendo ubicación...';

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setCoords(loc.lat, loc.lng);

                    if (mapInstance) {
                        mapInstance.setCenter(loc);
                        mapInstance.setZoom(16);
                        markerInstance.setPosition(loc);
                    }

                    new google.maps.Geocoder().geocode({ location: loc }, (results, status) => {
                        if (status === 'OK' && results && results[0]) {
                            searchInput.value = results[0].formatted_address;
                            if (opts.addressFieldName && form) {
                                const addressInput = form.querySelector(`[name="${opts.addressFieldName}"]`);
                                if (addressInput) addressInput.value = results[0].formatted_address;
                            }
                        }
                        gpsBtn.disabled = false;
                        gpsBtn.innerHTML = '<i class="fas fa-check"></i> Ubicación obtenida';
                        setTimeout(() => {
                            gpsBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Usar mi ubicación actual';
                        }, 2500);

                        if (estaFueraDePiura(loc.lat, loc.lng)) {
                            showToast('Tu ubicación actual parece estar fuera de Piura. Verifica el punto en el mapa.', 'warning');
                        }
                    });

                    if (typeof opts.onPlaceChanged === 'function') {
                        opts.onPlaceChanged({ geometry: { location: new google.maps.LatLng(loc.lat, loc.lng) } });
                    }
                },
                (err) => {
                    gpsBtn.disabled = false;
                    gpsBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Usar mi ubicación actual';
                    const mensaje = err.code === 1
                        ? 'Debes permitir el acceso a tu ubicación para usar esta opción.'
                        : 'No se pudo obtener tu ubicación. Intenta escribir la dirección.';
                    showToast(mensaje, 'error');
                },
                { timeout: 8000, enableHighAccuracy: true }
            );
        });

        const piuraBounds = new google.maps.LatLngBounds(
            { lat: -5.90, lng: -81.35 }, // suroeste
            { lat: -4.05, lng: -79.20 }  // noreste
        );

        const autocomplete = new google.maps.places.Autocomplete(searchInput, {
            fields: ['geometry', 'formatted_address', 'name'],
            componentRestrictions: { country: 'pe' },
            bounds: piuraBounds,
            strictBounds: true
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) return;

            const loc = place.geometry.location;
            setCoords(loc.lat(), loc.lng());

            if (mapInstance) {
                mapInstance.setCenter(loc);
                mapInstance.setZoom(16);
                markerInstance.setPosition(loc);
            }

            if (opts.addressFieldName && form) {
                const addressInput = form.querySelector(`[name="${opts.addressFieldName}"]`);
                if (addressInput) addressInput.value = place.formatted_address || place.name || addressInput.value;
            }

            if (typeof opts.onPlaceChanged === 'function') {
                opts.onPlaceChanged(place);
            }
        });

        function intentarUbicacionPegada(texto) {
            if (!texto) return false;
            let lat = null, lng = null;

            let match = texto.match(/^\s*(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
            if (!match) match = texto.match(/[@=](-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);

            if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
            }

            if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return false;
            if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;

            const loc = new google.maps.LatLng(lat, lng);
            setCoords(lat, lng);

            if (mapInstance) {
                mapInstance.setCenter(loc);
                mapInstance.setZoom(17);
                markerInstance.setPosition(loc);
            }

            new google.maps.Geocoder().geocode({ location: loc }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    searchInput.value = results[0].formatted_address;
                    if (opts.addressFieldName && form) {
                        const addressInput = form.querySelector(`[name="${opts.addressFieldName}"]`);
                        if (addressInput) addressInput.value = results[0].formatted_address;
                    }
                }
            });

            if (typeof opts.onPlaceChanged === 'function') {
                opts.onPlaceChanged({ geometry: { location: loc }, formatted_address: texto });
            }
            return true;
        }

        searchInput.addEventListener('paste', () => {
            setTimeout(() => intentarUbicacionPegada(searchInput.value), 0);
        });

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
