// watch.js

// Hàm thêm phim vào lịch sử xem
function addMovieToHistory(movieId) {
    if (!movieId) return;
    const MAX_HISTORY_LENGTH = 20;
    let history = JSON.parse(localStorage.getItem('movieHistory') || '[]');
    // Xóa phim nếu đã tồn tại để đưa lên đầu danh sách
    history = history.filter(id => id !== movieId);
    // Thêm phim mới nhất vào đầu
    history.unshift(movieId);
    // Giữ cho lịch sử không quá dài
    if (history.length > MAX_HISTORY_LENGTH) {
        history = history.slice(0, MAX_HISTORY_LENGTH);
    }
    localStorage.setItem('movieHistory', JSON.stringify(history));
}

// Hàm khởi tạo danh sách phim gợi ý
function initializeSuggestions(currentMovieId) {
    const suggestionsGrid = document.getElementById('suggestions-grid');
    if (!suggestionsGrid) return;

    const SUGGESTIONS_COUNT = 6;
    // Lấy danh sách phim ngoại trừ phim hiện tại
    const potentialSuggestions = MOVIES_DATA.filter(m => m.id !== currentMovieId);

    // Xáo trộn danh sách để gợi ý ngẫu nhiên
    for (let i = potentialSuggestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [potentialSuggestions[i], potentialSuggestions[j]] = [potentialSuggestions[j], potentialSuggestions[i]];
    }

    const suggestions = potentialSuggestions.slice(0, SUGGESTIONS_COUNT);
    suggestionsGrid.innerHTML = '';
    suggestions.forEach(movie => {
        // Sử dụng hàm createMovieCard từ main.js để tạo thẻ phim
        suggestionsGrid.appendChild(createMovieCard(movie));
    });
}

// Hàm xử lý tìm kiếm
function searchMovies() {
    const query = document.getElementById("search-input").value.trim();
    if (!query) return;
    // Lưu từ khóa tìm kiếm vào sessionStorage và chuyển hướng về trang chủ
    sessionStorage.setItem('redirectSearch', query);
    window.location.href = 'index.html';
}

// Hàm cuộn lên đầu trang
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// =================================================================
// === CODE CHÍNH CỦA TRANG WATCH ===
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Lấy ID phim từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    const movie = MOVIES_DATA.find(m => m.id === movieId);

    // Nếu không tìm thấy phim, hiển thị thông báo
    if (!movie) {
        document.getElementById('movie-title').textContent = 'Không tìm thấy phim!';
        return;
    }

    // Xử lý các tác vụ chính
    addMovieToHistory(movieId);
    initializeSuggestions(movieId);
    document.title = movie.title;

    // Cập nhật thông tin sidebar
    document.getElementById('movie-title').textContent = movie.title;
    document.getElementById('sidebar-poster-img').src = movie.poster;
    document.getElementById('movie-description-content').innerHTML = movie.description;

    // Điền thông tin meta (diễn viên, thể loại, năm)
    const actorsSpan = document.getElementById('sidebar-movie-actors');
    const genreSpan = document.getElementById('sidebar-movie-genre');
    const yearSpan = document.getElementById('sidebar-movie-year');

    if (actorsSpan) {
        actorsSpan.textContent = movie.actor || 'Đang cập nhật';
    }
    if (genreSpan) {
        genreSpan.textContent = movie['movie-genre'] || 'Đang cập nhật';
    }
    if (yearSpan) {
        yearSpan.textContent = movie.year || 'Đang cập nhật';
    }


    const playerContainer = document.getElementById('iframe-player-container');
    const serverList = document.getElementById('server-list');
    const audioTypeSelection = document.getElementById('audio-type-selection');
    const sourceTitle = document.getElementById('source-title');

    // Hàm để phát phim trong iframe
    function playInIframe(url) {
        playerContainer.innerHTML = ''; // Xóa trình phát cũ
        const iframe = document.createElement('iframe');
        iframe.id = 'iframe-player';
        iframe.src = url;
        iframe.style.width = '100%';
        iframe.style.border = '0';
        iframe.style.aspectRatio = '16 / 9';
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('referrerpolicy', 'no-referrer');
        playerContainer.appendChild(iframe);
        
        scrollToTop(); // Tự động cuộn lên đầu khi đổi server
    }

    // Hàm hiển thị các nút chọn server
    function renderServerButtons(sources, selectedAudioType) {
        serverList.innerHTML = '';
        const sourceButtons = [];
        sources.forEach(source => {
            const button = document.createElement('button');
            button.className = 'server-btn';
            button.textContent = source.name;
            button.onclick = () => {
                // Xóa trạng thái active của các nút khác
                document.querySelectorAll('#server-list .server-btn').forEach(btn => {
                    btn.classList.remove('active');
                    btn.disabled = false;
                });
                // Kích hoạt nút được chọn
                button.classList.add('active');
                button.disabled = true;
                playInIframe(source.url);
                // Lưu lựa chọn của người dùng
                localStorage.setItem(`lastSourceUrl_${movieId}`, source.url);
                localStorage.setItem(`lastAudioType_${movieId}`, selectedAudioType);
            };
            serverList.appendChild(button);
            sourceButtons.push(button);
        });

        // Tự động chọn lại server/audio đã xem lần trước
        const lastSourceUrl = localStorage.getItem(`lastSourceUrl_${movieId}`);
        const lastAudioType = localStorage.getItem(`lastAudioType_${movieId}`);
        let sourceFound = false;

        if (lastSourceUrl && lastAudioType === selectedAudioType) {
            const sourceIndex = sources.findIndex(s => s.url === lastSourceUrl);
            if (sourceIndex !== -1 && sourceButtons[sourceIndex]) {
                sourceButtons[sourceIndex].click();
                sourceFound = true;
            }
        }
        
        // Nếu không có lựa chọn nào được lưu, tự động phát server đầu tiên
        if (!sourceFound && sourceButtons.length > 0) {
            sourceButtons[0].click();
        }
    }

    // Logic xử lý nguồn phát (phim có nhiều loại âm thanh hoặc chỉ có một)
    if (movie.sources && Object.keys(movie.sources).length > 0) {
        const audioTypes = Object.keys(movie.sources);

        // Nếu có nhiều hơn một loại âm thanh (Lồng tiếng, Vietsub,...)
        if (audioTypes.length > 1) {
            sourceTitle.innerHTML = `<i class="fas fa-headphones"></i> Loại âm thanh`;
            audioTypes.forEach(type => {
                const button = document.createElement('button');
                button.className = 'server-btn audio-type-btn';
                button.textContent = type;
                button.onclick = () => {
                    document.querySelectorAll('.audio-type-btn').forEach(btn => {
                        btn.classList.remove('active');
                        btn.disabled = false;
                    });
                    button.classList.add('active');
                    button.disabled = true;
                    // Hiển thị danh sách server tương ứng với loại âm thanh
                    renderServerButtons(movie.sources[type], type);
                };
                audioTypeSelection.appendChild(button);
            });
            // Thêm tiêu đề cho phần chọn server
            const serverTitle = document.createElement('h2');
            serverTitle.innerHTML = `<i class="fas fa-server"></i> Nguồn phát`;
            audioTypeSelection.parentNode.insertBefore(serverTitle, serverList);
        } else {
             sourceTitle.innerHTML = `<i class="fas fa-server"></i> Nguồn phát`;
        }

        const lastAudioType = localStorage.getItem(`lastAudioType_${movieId}`);
        const defaultAudioType = lastAudioType && movie.sources[lastAudioType] ? lastAudioType : audioTypes[0];
        
        if (audioTypes.length > 1) {
            const defaultTypeButton = document.querySelector(`#audio-type-selection .server-btn:nth-of-type(${audioTypes.indexOf(defaultAudioType) + 1})`);
            if (defaultTypeButton) {
                defaultTypeButton.click();
            } else if (document.querySelector('#audio-type-selection .server-btn')) {
                document.querySelector('#audio-type-selection .server-btn').click(); // Fallback to the first button
            }
        } else {
            // Nếu chỉ có một loại âm thanh, hiển thị luôn danh sách server
            renderServerButtons(movie.sources[defaultAudioType], defaultAudioType);
        }

    } else {
        serverList.innerHTML = '<p>Xin lỗi, phim này hiện chưa có nguồn phát.</p>';
    }
    
    // Logic xử lý thanh tìm kiếm trên header
    const searchInput = document.getElementById('search-input');
    const searchGroup = document.querySelector('.search-group');
    const searchBtn = document.getElementById('search-btn');
    const headerContainer = document.querySelector('.header-container');
    const header = document.querySelector('header'); 

    if (searchGroup && searchInput && searchBtn && headerContainer && header) {
        searchBtn.addEventListener('click', (e) => {
            if (!searchGroup.classList.contains('active')) {
                e.preventDefault();
                searchGroup.classList.add('active');
                headerContainer.classList.add('search-active');
                searchInput.focus();
                header.classList.add('scrolled');
            } else {
                searchMovies();
            }
        });

        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') searchMovies();
        });

        searchInput.addEventListener('search', () => {
            if (searchInput.value === '') {
                searchGroup.classList.remove('active');
                headerContainer.classList.remove('search-active');
                if (window.innerWidth <= 820 && window.scrollY <= 50) {
                    header.classList.remove('scrolled');
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchGroup.contains(e.target) && searchInput.value === '') {
                searchGroup.classList.remove('active');
                headerContainer.classList.remove('search-active');
                if (window.innerWidth <= 820 && window.scrollY <= 50) {
                    header.classList.remove('scrolled');
                }
            }
        });
    }

    // Hiệu ứng header khi cuộn trang
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
        // Luôn bật hiệu ứng scrolled trên trang watch để header luôn có nền
        if (!header.classList.contains('scrolled')) {
            header.classList.add('scrolled'); 
        }
    }

    // Nút làm mới danh sách gợi ý
    const refreshBtn = document.getElementById('refresh-suggestions-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const suggestionsGrid = document.getElementById('suggestions-grid');
            if (!suggestionsGrid) {
                return;
            }
            suggestionsGrid.style.opacity = 0;
            setTimeout(() => {
                initializeSuggestions(movieId);
                suggestionsGrid.style.opacity = 1;
            }, 300);
        });
    }
});