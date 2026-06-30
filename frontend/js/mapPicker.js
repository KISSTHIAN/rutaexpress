// ============================================================
// MapPicker: selector de ubicación con Google Maps
// ============================================================
// Se usa en los formularios de encomienda y viaje para que la persona
// busque una dirección (autocompletado) y/o ajuste el punto exacto
// arrastrando un marcador sobre el mapa. Guarda lat/lng en campos
// ocultos del formulario para enviarlos junto con el resto de datos.
//
// Uso:
//   1. En el HTML del formulario, poner un <div> contenedor con un id
//      único, por ejemplo: <div id="mapOrigen"></div>
//   2. Después de insertar ese HTML en el DOM, llamar:
//        MapPicker.render('mapOrigen', { fieldPrefix: 'origin' });
//      Esto crea los inputs ocultos origin_lat / origin_lng dentro del
//      mismo formulario y dibuja el mapa + el buscador.
//   3. Al leer el formulario, los campos origin_lat/origin_lng ya
//      vienen incluidos en getFormData(form).
//
// Si Google Maps todavía no cargó (key sin configurar, sin red, etc.)
// el selector se degrada a un simple input de texto, para que el
// formulario nunca quede roto.

const MapPicker = {
    _instances: {},
    _defaultCenter: { lat: -8.1116, lng: -79.0288 }, // Trujillo, Perú (ajustable)

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
            fullscreenControl: false
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

        // Permitir hacer click en el mapa para mover el marcador también
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

            // Si se indicó un input de dirección visible en el formulario,
            // completarlo automáticamente con la dirección elegida.
            if (opts.addressFieldName && form) {
                const addressInput = form.querySelector(`[name="${opts.addressFieldName}"]`);
                if (addressInput) addressInput.value = place.formatted_address || place.name || addressInput.value;
            }

            if (typeof opts.onPlaceChanged === 'function') {
                opts.onPlaceChanged(place);
            }
        });

        // Intentar centrar en la ubicación actual del usuario al abrir,
        // solo si no se pasó una ubicación inicial ya conocida.
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
