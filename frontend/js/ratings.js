// ============================================================
// Ratings: calificaciones y reseñas de conductores
// ============================================================
// Se usa en dos lugares:
//   1. userPanel.js → historial de pedidos culminados: botón "Calificar"
//   2. driverPanel.js → sección "Mis Reseñas": muestra las reseñas recibidas
// También renderiza estrellas inline en las tarjetas de conductores disponibles.

const Ratings = {

    // Dibuja N estrellas (rellenas/vacías) a partir de un promedio (0-5).
    // returnHTML=true devuelve el string; false lo escribe en targetEl.
    renderStars(promedio, total, returnHTML = true) {
        const p = parseFloat(promedio) || 0;
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (p >= i) {
                stars += `<i class="fas fa-star rating-star filled"></i>`;
            } else if (p >= i - 0.5) {
                stars += `<i class="fas fa-star-half-alt rating-star filled"></i>`;
            } else {
                stars += `<i class="far fa-star rating-star"></i>`;
            }
        }
        const html = `<span class="rating-stars">${stars}</span><span class="rating-count">${p > 0 ? p.toFixed(1) : 'Sin calif.'} ${total ? `(${total})` : ''}</span>`;
        if (returnHTML) return html;
        return html;
    },

    // Muestra el modal para que el usuario deje su calificación.
    // tipo_pedido: 'encomienda' | 'viaje'
    // pedidoId: id del pedido
    // nombreConductor: texto para mostrar en el modal
    openRatingModal(tipo_pedido, pedidoId, nombreConductor) {
        let estrellasSeleccionadas = 0;

        openModal(
            `<i class="fas fa-star" style="color:var(--yellow)"></i> Calificar conductor`,
            `
            <p style="margin-bottom:12px">¿Cómo fue tu experiencia con <strong>${nombreConductor || 'el conductor'}</strong>?</p>
            <div class="rating-input-row" id="ratingStarsInput">
                ${[1,2,3,4,5].map(n => `
                    <button class="rating-star-btn" data-star="${n}" onclick="Ratings._selectStar(${n})" type="button">
                        <i class="far fa-star" id="ratingStar${n}"></i>
                    </button>`).join('')}
            </div>
            <div class="form-group" style="margin-top:16px">
                <label>Comentario (opcional)</label>
                <textarea id="ratingComment" class="form-control" rows="3" placeholder="Cuéntanos tu experiencia..." maxlength="500"></textarea>
            </div>
            `,
            `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
             <button class="btn btn-primary" id="btnEnviarCalif" disabled
                     onclick="Ratings._enviar('${tipo_pedido}', ${pedidoId})">
               <i class="fas fa-paper-plane"></i> Enviar calificación
             </button>`
        );
    },

    _selectStar(n) {
        for (let i = 1; i <= 5; i++) {
            const el = document.getElementById(`ratingStar${i}`);
            if (!el) continue;
            el.className = i <= n ? 'fas fa-star' : 'far fa-star';
        }
        // Guardar en el botón de enviar vía data attribute
        const btn = document.getElementById('btnEnviarCalif');
        if (btn) {
            btn.dataset.stars = n;
            btn.disabled = false;
        }
    },

    async _enviar(tipo_pedido, pedidoId) {
        const btn = document.getElementById('btnEnviarCalif');
        const estrellas = parseInt(btn?.dataset?.stars, 10) || 0;
        if (!estrellas) { showToast('Elige al menos una estrella', 'error'); return; }

        const comentario = document.getElementById('ratingComment')?.value?.trim() || '';

        try {
            showLoader();
            await apiCall('/ratings', {
                method: 'POST',
                body: JSON.stringify({ tipo_pedido, pedido_id: pedidoId, estrellas, comentario })
            });
            hideLoader();
            closeModal();
            showToast('¡Gracias por tu calificación! ⭐', 'success');
            // Recargar la vista actual (historial) para que el botón cambie a "Ya calificado"
            if (typeof App !== 'undefined' && App.router) App.router();
        } catch (e) {
            hideLoader();
            if (e.message && e.message.toLowerCase().includes('ya calificaste')) {
                closeModal();
                showToast('Ya habías calificado este pedido', 'info');
            } else {
                showToast(e.message || 'Error al enviar calificación', 'error');
            }
        }
    },

    // Carga y renderiza la sección "Mis Reseñas" para el panel del conductor.
    async renderDriverReviewsHTML() {
        try {
            const res = await apiCall('/ratings/driver/mine');
            const resenas = res.data || [];

            if (resenas.length === 0) {
                return `<div class="empty-state"><i class="fas fa-star" style="color:var(--yellow)"></i><p>Aún no tienes reseñas. ¡Completa tus primeros pedidos para recibir calificaciones!</p></div>`;
            }

            const promedio = resenas.reduce((s, r) => s + r.estrellas, 0) / resenas.length;

            return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-star" style="color:var(--yellow)"></i> Mis Reseñas</div>
                    <div>${Ratings.renderStars(promedio, resenas.length)}</div>
                </div>
                <div class="card-body">
                    <div class="review-list">
                        ${resenas.map(r => `
                        <div class="review-item">
                            <div class="review-header">
                                <div class="review-author">
                                    <div class="avatar-mini">${(r.nombre_usuario || '?')[0].toUpperCase()}</div>
                                    <strong>${r.nombre_usuario || 'Usuario'}</strong>
                                </div>
                                <div class="review-meta">
                                    ${Ratings.renderStars(r.estrellas, 0)}
                                    <span class="text-muted" style="font-size:12px">${formatDateShort(r.fecha_creacion)}</span>
                                </div>
                            </div>
                            ${r.comentario ? `<p class="review-comment">"${r.comentario}"</p>` : ''}
                        </div>`).join('')}
                    </div>
                </div>
            </div>`;
        } catch (e) {
            return `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>No se pudieron cargar las reseñas.</p></div>`;
        }
    }
};
