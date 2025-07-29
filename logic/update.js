// update.js - PHIÊN BẢN HOÀN CHỈNH - TÍCH HỢP BỘ LỌC NÂNG CAO
document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // CẤU HÌNH VÀ BIẾN TOÀN CỤC
    // =================================================================
    const CORRECT_USERNAME = "admin";
    const CORRECT_PASSWORD = "12346";

    let moviesData = [];
    let currentFilteredMovies = [];
    let currentPage = 1;
    const ITEMS_PER_PAGE = 20;

    // DOM Elements
    const passwordOverlay = document.getElementById('password-overlay');
    const mainContent = document.getElementById('main-content');
    const passwordForm = document.getElementById('password-form');
    const alertOverlay = document.getElementById('custom-alert-overlay');
    const movieListEl = document.getElementById('movie-list');
    const paginationContainer = document.getElementById('pagination-container');
    const movieCountDisplay = document.getElementById('movie-count-display');
    const modal = document.getElementById('edit-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const addNewMovieBtn = document.getElementById('add-new-movie-btn');
    const editForm = document.getElementById('edit-form');
    const downloadBtn = document.getElementById('download-btn');
    const sourcesContainer = document.getElementById('sources-container');
    const addSourceTypeBtn = document.getElementById('add-source-type-btn');
    const searchInput = document.getElementById('search-input');
    const clearDraftBtn = document.getElementById('clear-draft-btn');
    const idInput = document.getElementById('id');
    const titleInput = document.getElementById('title');
    const yearInput = document.getElementById('year');
    const posterInput = document.getElementById('poster');
    const slideSelect = document.getElementById('slide');
    const posterSlideContainer = document.getElementById('poster-slide-container');
    const posterSlideInput = document.getElementById('poster-slide-input');
    const countryInput = document.getElementById('country');
    const actorInput = document.getElementById('actor');
    const genreInput = document.getElementById('movie-genre');
    const descriptionInput = document.getElementById('description');
    const alertMessage = document.getElementById('custom-alert-message');
    const alertIcon = document.getElementById('custom-alert-icon');
    const alertBox = document.getElementById('custom-alert-box');
    const alertConfirmBtn = document.getElementById('custom-alert-confirm-btn');
    const alertCancelBtn = document.getElementById('custom-alert-cancel-btn');
    const passwordError = document.getElementById('password-error');
    const passwordInput = document.getElementById('password-input');

    // Filter Popup Elements
    const filterPopup = document.getElementById('filter-popup');
    const filterOverlay = document.getElementById('filter-overlay');
    const openFilterBtn = document.getElementById('open-filter-btn');
    const closeFilterBtn = filterPopup.querySelector('.filter-close-btn');
    const applyFilterBtn = document.getElementById('apply-filter-btn');
    const resetFilterBtn = document.getElementById('reset-filter-btn');
    const filterYearInput = document.getElementById('filter-year');
    const filterIs18PlusCheckbox = document.getElementById('filter-is-18plus');
    const filterIsSlideCheckbox = document.getElementById('filter-is-slide');

    // === KHỐI LƯU TRỮ DANH SÁCH PHIM ===
    function persistMoviesToStorage() {
        localStorage.setItem('movieManagerData', JSON.stringify(moviesData));
        updateMovieCount();
    }

    function initializeData() {
        const storedData = localStorage.getItem('movieManagerData');
        if (storedData) {
            moviesData = JSON.parse(storedData);
        } else {
            moviesData = JSON.parse(JSON.stringify(MOVIES_DATA));
        }
        applyAllFilters(true);
    }

    // === KHỐI LƯU BẢN NHÁP FORM ===
    function saveMovieDraft() {
        if (document.getElementById('movie-id-input').value) return;
        const sources = {};
        sourcesContainer.querySelectorAll('.source-type-group').forEach(group => {
            const audioType = group.querySelector('.audio-type-select').value;
            if (audioType) {
                if (!sources[audioType]) sources[audioType] = [];
                group.querySelectorAll('.server-item').forEach(item => {
                    sources[audioType].push({
                        name: item.querySelector('.server-name-input').value,
                        url: item.querySelector('.server-url-input').value,
                    });
                });
            }
        });
        const draftData = {
            title: titleInput.value,
            year: yearInput.value,
            id: idInput.value,
            poster: posterInput.value,
            'poster-slide': posterSlideInput.value,
            country: countryInput.value,
            'movie-genre': genreInput.value,
            actor: actorInput.value,
            category: document.getElementById('category').value,
            age: document.getElementById('age').value,
            slide: slideSelect.value,
            description: descriptionInput.value,
            sources: sources
        };
        localStorage.setItem('unsavedMovieData', JSON.stringify(draftData));
    }

    function loadMovieDraft() {
        const draftDataJSON = localStorage.getItem('unsavedMovieData');
        if (!draftDataJSON) return;
        const draftData = JSON.parse(draftDataJSON);
        editForm.reset();
        sourcesContainer.innerHTML = '';
        titleInput.value = draftData.title || '';
        yearInput.value = draftData.year || '';
        idInput.value = draftData.id || '';
        posterInput.value = draftData.poster || '';
        countryInput.value = draftData.country || '';
        genreInput.value = draftData['movie-genre'] || '';
        actorInput.value = draftData.actor || '';
        document.getElementById('category').value = draftData.category || 'phim-le';
        document.getElementById('age').value = draftData.age || '';
        slideSelect.value = draftData.slide || '0';
        posterSlideInput.value = draftData['poster-slide'] || '';
        descriptionInput.value = draftData.description || '';

        handleSlideChange();

        if (draftData.sources) {
            for (const audioType in draftData.sources) {
                addSourceTypeToForm(audioType, []);
                const serversListEl = sourcesContainer.lastChild.querySelector('.servers-list');
                serversListEl.innerHTML = '';
                draftData.sources[audioType].forEach(server => {
                    addServerToForm(serversListEl, server.name, server.url);
                });
            }
        }
        clearDraftBtn.style.display = 'inline-block';
    }

    // === HÀM GIAO DIỆN TÙY CHỈNH ===
    function showCustomAlert(message, type = 'success') {
        return new Promise((resolve) => {
            alertMessage.innerHTML = message;
            alertIcon.className = '';
            alertBox.style.borderColor = '';
            switch (type) {
                case 'error':
                    alertIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
                    alertIcon.className = 'error';
                    alertBox.style.borderColor = '#dc3545';
                    alertCancelBtn.style.display = 'none';
                    alertConfirmBtn.innerText = 'Đóng';
                    break;
                case 'confirm':
                    alertIcon.innerHTML = '<i class="fas fa-question-circle"></i>';
                    alertIcon.className = 'confirm';
                    alertBox.style.borderColor = 'var(--color-accent-hover)';
                    alertCancelBtn.style.display = 'inline-block';
                    alertConfirmBtn.innerText = 'Xác nhận';
                    break;
                default:
                    alertIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
                    alertIcon.className = 'success';
                    alertBox.style.borderColor = '#28a745';
                    alertCancelBtn.style.display = 'none';
                    alertConfirmBtn.innerText = 'OK';
                    break;
            }
            alertOverlay.classList.add('visible');
            alertConfirmBtn.onclick = () => {
                alertOverlay.classList.remove('visible');
                resolve(true);
            };
            alertCancelBtn.onclick = () => {
                alertOverlay.classList.remove('visible');
                resolve(false);
            };
        });
    }

    // === CÁC HÀM TIỆN ÍCH KHÁC ===
    function removeVietnameseTones(str) {
        if (!str) return '';
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");
        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
        str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
        return str;
    }

    function generateSlug(title, year) {
        if (!title) return '';
        let slug = removeVietnameseTones(title).toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
        if (year.trim()) slug = `${slug}-${year.trim()}`;
        return slug;
    }
    function autoUpdateGeneratedFields() {
        if (!idInput.readOnly) {
            const generatedId = generateSlug(titleInput.value, yearInput.value);
            idInput.value = generatedId;
        }
    }
    function handleSlideChange() {
        if (slideSelect.value === '1') {
            posterSlideContainer.style.display = 'block';
        } else {
            posterSlideContainer.style.display = 'none';
        }
    }

    // === CÁC HÀM XỬ LÝ CHÍNH ===
    function getFilteredMovies() {
        let results = [...moviesData];

        const year = filterYearInput.value.trim();
        const is18Plus = filterIs18PlusCheckbox.checked;
        const isSlide = filterIsSlideCheckbox.checked;

        if (year) {
            results = results.filter(movie => movie.year === year);
        }
        if (is18Plus) {
            results = results.filter(movie => movie.age === '18+');
        }
        if (isSlide) {
            results = results.filter(movie => movie.slide === '1');
        }

        const query = searchInput.value.trim();
        if (query) {
            const normalizedQuery = removeVietnameseTones(query.toLowerCase());
            results = results.filter(m =>
                removeVietnameseTones(m.title.toLowerCase()).includes(normalizedQuery) ||
                m.id.toLowerCase().includes(normalizedQuery)
            );
        }

        return results;
    }

    function applyAllFilters(resetToFirstPage = true) {
        currentFilteredMovies = getFilteredMovies();
        if (resetToFirstPage) {
            displayPage(1);
        } else {
            reFilterAndDisplayCurrentPage();
        }
    }

    function updateMovieCount() {
        if (!movieCountDisplay) return;
        const filteredCount = currentFilteredMovies.length;
        const totalCount = moviesData.length;
        const isUnsaved = localStorage.getItem('movieManagerData') !== null;
        const status = isUnsaved ? '<span style="color: #ffc107;">(Có thay đổi chưa lưu)</span>' : '<span style="color: #28a745;">(Đã đồng bộ)</span>';

        let filterStatus = [];
        if (filterYearInput.value) filterStatus.push(`Năm: ${filterYearInput.value}`);
        if (filterIs18PlusCheckbox.checked) filterStatus.push("18+");
        if (filterIsSlideCheckbox.checked) filterStatus.push("Slide");

        let statusText = `Tổng số: ${totalCount} phim.`;
        if (filterStatus.length > 0 || searchInput.value) {
            statusText = `Tìm thấy ${filteredCount} / ${totalCount} phim.`;
            if (filterStatus.length > 0) {
                statusText += ` (Đang lọc: ${filterStatus.join(', ')})`;
            }
        }
        movieCountDisplay.innerHTML = statusText + ` ${status}`;
    }

    function displayPage(page) {
        currentPage = page;
        movieListEl.innerHTML = '';

        const paginatedItems = currentFilteredMovies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

        paginatedItems.forEach(movie => {
            const movieEl = document.createElement('div');
            movieEl.className = 'movie-list-item';
            let labelsHtml = '';
            if (movie.age && movie.age.includes('18+')) {
                labelsHtml += `<span class="info-label age-plus-label">18+</span>`;
            }
            if (movie.slide === "1") {
                labelsHtml += `<span class="info-label slide-label"><i class="fas fa-star"></i> Hiển thị trên Slide</span>`;
            }
            movieEl.innerHTML = `
                <div style="padding: 0 15px 0 5px;">
                    <input type="checkbox" class="movie-checkbox" value="${movie.id}" title="Chọn phim này">
                </div>
                <img src="${movie.poster}" alt="${movie.title}" onerror="this.onerror=null;this.src='https://placehold.co/60x90/333/ccc?text=No+Img';">
                <div class="movie-list-info">
                    <h3>${movie.title}</h3>
                    <p>ID: ${movie.id} | Năm: ${movie.year}</p>
                    ${labelsHtml ? `<div class="info-labels-container">${labelsHtml}</div>` : ''}
                </div>
                <div class="movie-list-actions">
                    <button class="check-btn" data-id="${movie.id}"><i class="fas fa-eye"></i> Xem Phim</button>
                    <button class="edit-btn" data-id="${movie.id}"><i class="fas fa-edit"></i> Sửa</button>
                    <button class="delete-btn" data-id="${movie.id}"><i class="fas fa-trash"></i> Xóa</button>
                </div>`;

            movieListEl.appendChild(movieEl);
        });

        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (selectAllCheckbox) selectAllCheckbox.checked = false;

        renderPaginationControls();
        updateMovieCount();
    }

    function renderPaginationControls() {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(currentFilteredMovies.length / ITEMS_PER_PAGE);
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        const onPageChange = (page) => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            displayPage(page);
        }

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '«';
        prevButton.disabled = currentPage === 1;
        prevButton.onclick = () => onPageChange(currentPage - 1);
        paginationContainer.appendChild(prevButton);

        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        if (totalPages > 5) {
            if (currentPage < 4) {
                endPage = 5;
            }
            if (currentPage > totalPages - 3) {
                startPage = totalPages - 4;
            }
        } else {
            startPage = 1;
            endPage = totalPages;
        }

        if (startPage > 1) {
            const firstPageButton = document.createElement('button');
            firstPageButton.textContent = '1';
            firstPageButton.onclick = () => onPageChange(1);
            paginationContainer.appendChild(firstPageButton);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.classList.add('ellipsis');
                paginationContainer.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.classList.toggle('active', i === currentPage);
            pageButton.onclick = () => onPageChange(i);
            paginationContainer.appendChild(pageButton);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.classList.add('ellipsis');
                paginationContainer.appendChild(ellipsis);
            }
            const lastPageButton = document.createElement('button');
            lastPageButton.textContent = totalPages;
            lastPageButton.onclick = () => onPageChange(totalPages);
            paginationContainer.appendChild(lastPageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.innerHTML = '»';
        nextButton.disabled = currentPage === totalPages;
        nextButton.onclick = () => onPageChange(currentPage + 1);
        paginationContainer.appendChild(nextButton);
    }

    async function openModal(movieId = null) {
        clearDraftBtn.style.display = 'none';
        sourcesContainer.innerHTML = '';
        if (movieId) {
            editForm.reset();
            const movie = moviesData.find(m => m.id === movieId);
            if (movie) {
                document.getElementById('modal-title').textContent = 'Sửa thông tin phim';
                document.getElementById('movie-id-input').value = movie.id;
                idInput.value = movie.id;
                idInput.readOnly = true;
                titleInput.value = movie.title || '';
                yearInput.value = movie.year || '';
                posterInput.value = movie.poster || '';
                countryInput.value = movie.country || '';
                genreInput.value = movie['movie-genre'] || '';
                actorInput.value = movie.actor || '';
                document.getElementById('category').value = movie.category || 'phim-le';
                document.getElementById('age').value = movie.age || '';
                slideSelect.value = movie.slide || '0';
                posterSlideInput.value = movie['poster-slide'] || '';
                descriptionInput.value = movie.description || '';
                if (movie.sources && typeof movie.sources === 'object') {
                    for (const audioType in movie.sources) {
                        addSourceTypeToForm(audioType, movie.sources[audioType]);
                    }
                }
            }
        } else {
            document.getElementById('modal-title').textContent = 'Thêm phim mới';
            document.getElementById('movie-id-input').value = '';
            idInput.value = '';
            idInput.readOnly = false;
            slideSelect.value = '0';
            const draftDataJSON = localStorage.getItem('unsavedMovieData');
            if (draftDataJSON) {
                const restore = await showCustomAlert('Phát hiện có một bản nháp chưa lưu. Bạn có muốn khôi phục không?', 'confirm');
                if (restore) {
                    loadMovieDraft();
                } else {
                    localStorage.removeItem('unsavedMovieData');
                    editForm.reset();
                }
            } else {
                editForm.reset();
            }
            autoUpdateGeneratedFields();
        }
        handleSlideChange();
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    function reFilterAndDisplayCurrentPage() {
        currentFilteredMovies = getFilteredMovies();

        const totalPages = Math.ceil(currentFilteredMovies.length / ITEMS_PER_PAGE);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }

        displayPage(currentPage);
    }

    async function saveMovie(e) {
        e.preventDefault();
        const existingId = document.getElementById('movie-id-input').value;
        const newId = idInput.value.trim();

        if (!newId) {
            return showCustomAlert('ID phim là bắt buộc!', 'error');
        }

        const isCreating = !existingId;

        if (isCreating && moviesData.some(m => m.id === newId)) {
            return showCustomAlert(`ID phim "${newId}" đã tồn tại. Vui lòng tạo một ID khác.`, 'error');
        }

        const movieData = {
            id: newId,
            title: titleInput.value.trim(),
            year: yearInput.value.trim(),
            poster: posterInput.value.trim(),
            'poster-slide': slideSelect.value === '1' ? posterSlideInput.value.trim() : '',
            country: countryInput.value.trim(),
            'movie-genre': genreInput.value.trim(),
            actor: actorInput.value.trim(),
            category: document.getElementById('category').value.trim(),
            age: document.getElementById('age').value.trim(),
            slide: slideSelect.value,
            description: descriptionInput.value.trim(),
            sources: {}
        };

        sourcesContainer.querySelectorAll('.source-type-group').forEach(group => {
            const audioType = group.querySelector('.audio-type-select').value;
            if (audioType) {
                movieData.sources[audioType] = [];
                group.querySelectorAll('.server-item').forEach(item => {
                    const name = item.querySelector('.server-name-input').value.trim();
                    const url = item.querySelector('.server-url-input').value.trim();
                    if (name && url) {
                        movieData.sources[audioType].push({
                            name,
                            url
                        });
                    }
                });
            }
        });

        if (isCreating) {
            moviesData.unshift(movieData);
            localStorage.removeItem('unsavedMovieData');
        } else {
            const index = moviesData.findIndex(m => m.id === existingId);
            if (index > -1) moviesData[index] = movieData;
        }

        persistMoviesToStorage();
        reFilterAndDisplayCurrentPage();
        closeModal();
        showCustomAlert('Lưu phim thành công!', 'success');
    }

    async function deleteMovie(movieId) {
        const confirmed = await showCustomAlert(`Bạn có chắc muốn xóa phim ID: ${movieId}?`, 'confirm');
        if (confirmed) {
            moviesData = moviesData.filter(m => m.id !== movieId);
            persistMoviesToStorage();
            reFilterAndDisplayCurrentPage();
            showCustomAlert('Đã xóa phim thành công!', 'success');
        }
    }

    function addSourceTypeToForm(audioType = 'Vietsub', servers = []) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'source-type-group';
        groupDiv.innerHTML = `
            <div class="source-type-header"><select class="audio-type-select">
                <option value="Vietsub" ${audioType === 'Vietsub' ? 'selected' : ''}>Vietsub</option>
                <option value="Lồng Tiếng" ${audioType === 'Lồng Tiếng' ? 'selected' : ''}>Lồng Tiếng</option>
                <option value="Thuyết Minh" ${audioType === 'Thuyết Minh' ? 'selected' : ''}>Thuyết Minh</option> 
            </select><button type="button" class="remove-btn remove-type-btn">×</button></div>
            <div class="servers-list"></div>
            <button type="button" class="action-btn add-server-btn" style="font-size: 0.8rem; padding: 5px 10px;"><i class="fas fa-plus"></i> Thêm Server</button>`;
        sourcesContainer.appendChild(groupDiv);
        const serversList = groupDiv.querySelector('.servers-list');
        if (servers.length > 0) {
            servers.forEach(server => addServerToForm(serversList, server.name, server.url));
        } else {
            addServerToForm(serversList);
        }
    }

    function addServerToForm(serversListEl, name = '', url = '') {
        const serverDiv = document.createElement('div');
        serverDiv.className = 'server-item';
        serverDiv.innerHTML = `
            <div class="server-inputs">
                <select class="server-name-input"><option value="Server 1">Server 1</option><option value="Server 2">Server 2</option><option value="Server 3">Server 3</option><option value="Server 4">Server 4</option></select>
                <input type="text" placeholder="Nhập link đầy đủ của server" class="server-url-input" value="${url}">
                <button type="button" class="remove-btn remove-server-btn">×</button>
            </div>`;
        serversListEl.appendChild(serverDiv);
        if (name) {
            const correctedName = name.replace('Sever', 'Server');
            serverDiv.querySelector('.server-name-input').value = correctedName;
        }
    }

    async function generateAndDownloadFile() {
        const checkedCheckboxes = document.querySelectorAll('.movie-checkbox:checked');
        let dataToExport;
        let confirmMessage;

        if (checkedCheckboxes.length > 0) {
            const moviesToExport = [];
            checkedCheckboxes.forEach(checkbox => {
                const movieId = checkbox.value;
                const movie = moviesData.find(m => m.id === movieId);
                if (movie) {
                    moviesToExport.push(movie);
                }
            });
            dataToExport = moviesToExport;
            confirmMessage = `Bạn có chắc muốn tạo file data.js chứa ${dataToExport.length} phim đã chọn không?`;
        } else {
            dataToExport = moviesData;
            confirmMessage = `Không có phim nào được chọn. Bạn có muốn xuất TẤT CẢ ${dataToExport.length} phim không?`;
        }

        const confirmed = await showCustomAlert(confirmMessage, 'confirm');
        if (confirmed) {
            const fileContent = `const MOVIES_DATA = ${JSON.stringify(dataToExport, null, 4)};`;
            const blob = new Blob([fileContent], { type: 'application/javascript;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'data.js';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (checkedCheckboxes.length === 0) {
                localStorage.removeItem('movieManagerData');
                showCustomAlert('File data.js chứa TẤT CẢ phim đã được tạo thành công!', 'success').then(() => updateMovieCount());
            } else {
                showCustomAlert(`File data.js chứa ${dataToExport.length} phim đã chọn đã được tạo.`, 'success');
            }
        }
    }

    async function bulkDeleteMovies() {
        const checkedCheckboxes = document.querySelectorAll('.movie-checkbox:checked');
        if (checkedCheckboxes.length === 0) {
            return showCustomAlert('Vui lòng chọn ít nhất một phim để xóa.', 'error');
        }

        const confirmMessage = `Bạn có chắc chắn muốn xóa vĩnh viễn ${checkedCheckboxes.length} phim đã chọn không? Hành động này không thể hoàn tác.`;
        const confirmed = await showCustomAlert(confirmMessage, 'confirm');

        if (confirmed) {
            const idsToDelete = Array.from(checkedCheckboxes).map(cb => cb.value);

            moviesData = moviesData.filter(movie => !idsToDelete.includes(movie.id));

            persistMoviesToStorage();
            reFilterAndDisplayCurrentPage();
            showCustomAlert(`Đã xóa thành công ${idsToDelete.length} phim.`, 'success');
        }
    }

    function setupSearchAndHeader() {
        const searchInput = document.getElementById('search-input');
        const searchGroup = document.querySelector('.search-group');
        const searchBtn = document.getElementById('search-btn');
        const headerContainer = document.querySelector('.header-container');

        if (searchGroup && searchInput && searchBtn && headerContainer) {
            searchBtn.addEventListener('click', (e) => {
                if (!searchGroup.classList.contains('active')) {
                    e.preventDefault();
                    searchGroup.classList.add('active');
                    headerContainer.classList.add('search-active');
                    searchInput.focus();
                }
            });
            document.addEventListener('click', (e) => {
                if (!searchGroup.contains(e.target) && searchInput.value === '') {
                    searchGroup.classList.remove('active');
                    headerContainer.classList.remove('search-active');
                }
            });
        }
    }

    function initializeSelectionActions() {
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');

        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', () => {
                const movieCheckboxes = document.querySelectorAll('.movie-checkbox');
                movieCheckboxes.forEach(checkbox => {
                    checkbox.checked = selectAllCheckbox.checked;
                });
            });
        }

        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', bulkDeleteMovies);
        }
    }

    // === KHỞI TẠO TRANG ===
    function initializePage() {
        initializeSelectionActions();

        titleInput.addEventListener('input', autoUpdateGeneratedFields);
        yearInput.addEventListener('input', autoUpdateGeneratedFields);
        slideSelect.addEventListener('change', handleSlideChange);
        addSourceTypeBtn.addEventListener('click', () => addSourceTypeToForm());
        searchInput.addEventListener('input', () => applyAllFilters(true));

        openFilterBtn.addEventListener('click', () => {
            filterPopup.style.display = 'block';
            filterOverlay.style.display = 'block';
        });

        const closeFilterPopup = () => {
            filterPopup.style.display = 'none';
            filterOverlay.style.display = 'none';
        };

        closeFilterBtn.addEventListener('click', closeFilterPopup);
        filterOverlay.addEventListener('click', closeFilterPopup);

        applyFilterBtn.addEventListener('click', () => {
            applyAllFilters(true);
            closeFilterPopup();
        });

        resetFilterBtn.addEventListener('click', () => {
            filterYearInput.value = '';
            filterIs18PlusCheckbox.checked = false;
            filterIsSlideCheckbox.checked = false;
            applyAllFilters(true);
            closeFilterPopup();
        });

        addNewMovieBtn.addEventListener('click', () => openModal());
        closeModalBtn.addEventListener('click', closeModal);
        editForm.addEventListener('submit', saveMovie);
        downloadBtn.addEventListener('click', generateAndDownloadFile);

        movieListEl.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = btn.dataset.id;

            if (btn.classList.contains('check-btn')) {
                window.open(`watch.html?id=${id}`, '_blank');
            } else if (btn.classList.contains('edit-btn')) {
                openModal(id);
            } else if (btn.classList.contains('delete-btn')) {
                deleteMovie(id);
            }
        });

        sourcesContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            if (btn.classList.contains('add-server-btn')) addServerToForm(btn.previousElementSibling);
            else if (btn.classList.contains('remove-server-btn')) btn.closest('.server-item').remove();
            else if (btn.classList.contains('remove-type-btn')) btn.closest('.source-type-group').remove();
        });

        initializeData();
        setupSearchAndHeader();
    }

    function handlePassword() {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('username-input');
            if (usernameInput.value === CORRECT_USERNAME && passwordInput.value === CORRECT_PASSWORD) {
                sessionStorage.setItem('isLoggedIn', 'true');
                passwordOverlay.style.display = 'none';
                mainContent.style.display = 'block';
                initializePage();
            } else {
                passwordError.textContent = 'Tên đăng nhập hoặc mật khẩu không chính xác.';
                passwordInput.value = '';
                usernameInput.focus();
            }
        });
    }

    // === LOGIC KHỞI ĐỘNG TRANG CHÍNH ===
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        passwordOverlay.style.display = 'none';
        mainContent.style.display = 'block';
        initializePage();
    } else {
        passwordOverlay.style.display = 'flex';
        mainContent.style.display = 'none';
        handlePassword();
    }
});