/* ============================================
   MOBILE HUB - MEMBERSHIP DASHBOARD JS
   ============================================ */

let allMembers = [];
let filteredMembers = [];
let currentPage = 1;
const ROWS_PER_PAGE = 10;
let currentMobileData = null;
let currentMemberData = null;
let dataCheckInterval = null;
let lastDataHash = null;

// ============================================
// Security: Disable Inspect & Developer Tools
// ============================================

function disableDeveloperTools() {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J (Windows/Linux)
    // Disable Cmd+Option+I, Cmd+Option+J, Cmd+Option+U, Cmd+Option+C (Mac)
    document.addEventListener('keydown', function(e) {
        // Windows/Linux shortcuts
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.shiftKey && e.key === 'K')) {
            e.preventDefault();
            alert('Developer tools are disabled for security purposes.');
            return false;
        }
        
        // Mac shortcuts (Cmd = metaKey)
        if ((e.metaKey && e.altKey && e.key === 'i') ||
            (e.metaKey && e.altKey && e.key === 'j') ||
            (e.metaKey && e.altKey && e.key === 'u') ||
            (e.metaKey && e.altKey && e.key === 'c')) {
            e.preventDefault();
            alert('Developer tools are disabled for security purposes.');
            return false;
        }
    });

    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        alert('Right-click is disabled for security purposes.');
        return false;
    });
}

// ============================================
// Create Obfuscated Password Hash
// ============================================

function validatePassword(input) {
    // Create hash of input and compare
    let hashInput = btoa(input); // Base64 encode
    let expectedHash = btoa('Aaditya'); // Pre-computed hash
    return hashInput === expectedHash;
}

// ============================================
// Initialize Application
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Enable security measures
    disableDeveloperTools();
    
    loadData();
    setupEventListeners();
    startDataChangeDetection();
});

function loadData() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allMembers = data.members;
            filteredMembers = [...allMembers];
            displayPage(1);
        })
        .catch(error => {
            console.error('Error loading data:', error);
            alert('Failed to load membership data');
        });
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    
    // Real-time search
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase().trim();
        performSearch(query);
    });

    // Allow Enter key to trigger search
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = e.target.value.toLowerCase().trim();
            performSearch(query);
        }
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        const benefitsModal = document.getElementById('benefitsModal');
        const passwordModal = document.getElementById('passwordModal');
        const unmaskedModal = document.getElementById('unmaskedMobileModal');

        if (e.target === benefitsModal) {
            closeBenefitsModal();
        }
        if (e.target === passwordModal) {
            closePasswordModal();
        }
        if (e.target === unmaskedModal) {
            closeUnmaskedModal();
        }
    });
}

// ============================================
// Data Change Detection & Auto-Reload
// ============================================

function startDataChangeDetection() {
    // Check for data changes every 3 seconds
    dataCheckInterval = setInterval(function() {
        fetch('data.json?t=' + new Date().getTime())
            .then(response => response.json())
            .then(data => {
                const currentHash = JSON.stringify(data);
                if (lastDataHash === null) {
                    lastDataHash = currentHash;
                } else if (lastDataHash !== currentHash) {
                    console.log('Data has changed! Reloading...');
                    showDataReloadNotification();
                    lastDataHash = currentHash;
                    // Reload after a short delay to show notification
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                }
            })
            .catch(error => console.log('Error checking data:', error));
    }, 3000);
}

function showDataReloadNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 14px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = '✓ Data updated! Reloading page...';
    document.body.appendChild(notification);
}

// ============================================
// Search Functionality
// ============================================

function performSearch(query) {
    if (query === '') {
        filteredMembers = [...allMembers];
    } else {
        filteredMembers = allMembers.filter(member => {
            const name = member.name.toLowerCase();
            const mobile = member.mobile.toLowerCase();
            const cardNumber = member.cardNumber.toLowerCase();
            const email = member.email.toLowerCase();
            const id = member.id.toString();
            const idNumber = member.idNumber.toLowerCase();

            return name.includes(query) || 
                   mobile.includes(query) || 
                   cardNumber.includes(query) ||
                   email.includes(query) ||
                   id.includes(query) ||
                   idNumber.includes(query);
        });
    }

    currentPage = 1;
    displayPage(1);
    updateSearchInfo();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    filteredMembers = [...allMembers];
    currentPage = 1;
    displayPage(1);
    updateSearchInfo();
}

function updateSearchInfo() {
    const searchInfo = document.getElementById('searchInfo');
    const query = document.getElementById('searchInput').value.trim();

    if (query === '') {
        searchInfo.textContent = '';
    } else if (filteredMembers.length === 0) {
        searchInfo.textContent = `❌ No members found for "${query}"`;
        searchInfo.style.color = 'var(--danger-color)';
    } else {
        searchInfo.textContent = `✓ Found ${filteredMembers.length} member(s)`;
        searchInfo.style.color = 'var(--success-color)';
    }
}

// ============================================
// Pagination Functionality
// ============================================

function displayPage(pageNum) {
    currentPage = pageNum;
    const startIndex = (pageNum - 1) * ROWS_PER_PAGE;
    const endIndex = startIndex + ROWS_PER_PAGE;
    const pageData = filteredMembers.slice(startIndex, endIndex);

    renderMembersTable(pageData);
    renderPagination();
    updatePaginationInfo();
}

function renderMembersTable(members) {
    const tbody = document.getElementById('membersTableBody');
    tbody.innerHTML = '';

    if (members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No members to display</td></tr>';
        return;
    }

    members.forEach((member, index) => {
        const row = document.createElement('tr');
        
        const maskedMobile = maskPhoneNumber(member.mobile);
        
        row.innerHTML = `
            <td class="serial-no">${member.serialNo}</td>
            <td class="member-name">${member.name}</td>
            <td class="mobile-number" onclick="showPasswordModal(event, '${member.mobile}')" title="Click to unmask">${maskedMobile}</td>
            <td class="card-number" onclick="showBenefitsModal(${member.id})">${member.cardNumber}</td>
            <td>${formatDate(member.cardIssuedDate)}</td>
            <td>${member.idType}</td>
            <td>${maskIdNumber(member.idNumber, member.idType)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function renderPagination() {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';

    const totalPages = Math.ceil(filteredMembers.length / ROWS_PER_PAGE);

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => displayPage(currentPage - 1);
    paginationDiv.appendChild(prevBtn);

    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.textContent = '1';
        firstBtn.onclick = () => displayPage(1);
        paginationDiv.appendChild(firstBtn);

        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.padding = '10px 5px';
            paginationDiv.appendChild(dots);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.onclick = () => displayPage(i);
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        paginationDiv.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.padding = '10px 5px';
            paginationDiv.appendChild(dots);
        }

        const lastBtn = document.createElement('button');
        lastBtn.textContent = totalPages;
        lastBtn.onclick = () => displayPage(totalPages);
        paginationDiv.appendChild(lastBtn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => displayPage(currentPage + 1);
    paginationDiv.appendChild(nextBtn);
}

function updatePaginationInfo() {
    const paginationInfo = document.getElementById('paginationInfo');
    const totalPages = Math.ceil(filteredMembers.length / ROWS_PER_PAGE);
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * ROWS_PER_PAGE, filteredMembers.length);

    paginationInfo.textContent = `Showing ${startIndex} - ${endIndex} of ${filteredMembers.length} members | Page ${currentPage} of ${totalPages}`;
}

// ============================================
// Modal Functions - Benefits
// ============================================

function showBenefitsModal(memberId) {
    const member = allMembers.find(m => m.id === memberId);
    if (!member) return;
    
    const modal = document.getElementById('benefitsModal');
    const modalTitle = document.getElementById('modalTitle');
    const benefitsContent = document.getElementById('benefitsContent');

    modalTitle.textContent = `${member.name} - Availed Benefits`;

    benefitsContent.innerHTML = '';

    if (!member.availedBenefits || member.availedBenefits.length === 0) {
        benefitsContent.innerHTML = '<p style="text-align: center; color: #999;">No benefits availed yet</p>';
    } else {
        const availedList = document.createElement('ul');
        availedList.className = 'benefits-list';

        member.availedBenefits.forEach((item, index) => {
            const li = document.createElement('li');
            li.style.cssText = `
                background: #ecfdf5 !important;
                border-left-color: #059669 !important;
            `;
            li.innerHTML = `
                <div>
                    <div style="font-weight: 600;">${item.benefit}</div>
                    <div style="font-size: 0.8rem; color: #6b7280; margin-top: 4px;">
                        Availed on: ${formatDate(item.availedDate)}
                    </div>
                </div>
            `;
            li.style.animationDelay = `${index * 0.05}s`;
            availedList.appendChild(li);
        });
        benefitsContent.appendChild(availedList);
    }

    modal.classList.add('show');
}

function closeBenefitsModal() {
    document.getElementById('benefitsModal').classList.remove('show');
}

// ============================================
// Modal Functions - Password & Unmasked Mobile
// ============================================

function showPasswordModal(event, mobileNumber) {
    event.stopPropagation();
    currentMobileData = mobileNumber;
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    
    passwordInput.value = '';
    passwordInput.focus();
    
    passwordModal.classList.add('show');
}

function closePasswordModal() {
    document.getElementById('passwordModal').classList.remove('show');
    document.getElementById('passwordInput').value = '';
}

function verifyPassword() {
    const password = document.getElementById('passwordInput').value;

    if (validatePassword(password)) {
        closePasswordModal();
        showUnmaskedMobileModal(currentMobileData);
    } else {
        alert('❌ Incorrect password!');
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
    }
}

function showUnmaskedMobileModal(mobileNumber) {
    const modal = document.getElementById('unmaskedMobileModal');
    const unmaskedNumber = document.getElementById('unmaskedNumber');
    
    // Format the number with spaces for readability
    const formatted = mobileNumber.replace(/(\d{2})(\d{4})(\d{5})/, '$1 $2 $3');
    unmaskedNumber.textContent = formatted;
    
    currentMobileData = mobileNumber;
    modal.classList.add('show');
}

function closeUnmaskedModal() {
    document.getElementById('unmaskedMobileModal').classList.remove('show');
}

function initiateCall() {
    const mobileNumber = currentMobileData;
    const telLink = `tel:${mobileNumber}`;
    
    // Try to initiate call
    window.location.href = telLink;
    
    // Fallback message if tel protocol is not supported
    setTimeout(() => {
        alert(`📞 Please call: ${mobileNumber}`);
    }, 500);
}

// ============================================
// Utility Functions
// ============================================

function maskPhoneNumber(phoneNumber) {
    // Format: XX XXXX XXXXX (shows first 2 and last 5 digits)
    if (phoneNumber.length !== 10) return phoneNumber;
    
    const first2 = phoneNumber.substring(0, 2);
    const last4 = phoneNumber.substring(8);
    
    return `${first2} ••••• ${last4}`;
}

function maskIdNumber(idNumber, idType) {
    if (idType === 'Aadhaar') {
        // Aadhaar: XX•••••••XXXX (12 digits total)
        if (idNumber.length !== 12) return idNumber;
        return `${idNumber.substring(0, 2)}•••••••${idNumber.substring(8)}`;
    } else if (idType === 'PAN') {
        // PAN: XXXXX••••XXXX (10 chars total)
        if (idNumber.length !== 10) return idNumber;
        return `${idNumber.substring(0, 5)}••••${idNumber.substring(8)}`;
    }
    return idNumber;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

// ============================================
// Keyboard Navigation
// ============================================

document.addEventListener('keydown', function(e) {
    // Close modals with Escape key
    if (e.key === 'Escape') {
        closeBenefitsModal();
        closePasswordModal();
        closeUnmaskedModal();
    }
});
