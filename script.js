

function selectRole(role) {
    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value;
    
    if (!username || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Store login credentials and role
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('role', role);
    localStorage.setItem('username', username);
    localStorage.setItem('userId', `${role}-${username}`);
    
    showToast(`Welcome ${role.charAt(0).toUpperCase() + role.slice(1)}!`, 'success');
    
    setTimeout(() => {
        if (role === 'teacher') {
            window.location.href = 'dashboard.html';
        } else if (role === 'student') {
            window.location.href = 'student.html';
        }
    }, 500);
}

function loginAsTeacher() {
    selectRole('teacher');
}

function loginAsStudent() {
    selectRole('student');
}

function handleLoginForm(e) {
    e.preventDefault();
    selectRole('student');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        showToast('Logged out successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }
}

// ====================
// ROUTE PROTECTION (CRITICAL)
// ====================

function protectPage() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('role');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Public pages
    const publicPages = ['index.html', ''];
    
    // Protected pages - require login
    const protectedPages = [
        'dashboard.html', 
        'student.html', 
        'student-check-result.html',
        'teacher-profile.html',
        'teacher-add-result.html',
        'teacher-view-results.html'
    ];
    
    // Check if current page is protected
    if (protectedPages.includes(currentPage)) {
        if (!isLoggedIn) {
            window.location.href = 'index.html';
            return;
        }
    }
    
    // Role-specific page protection
    // Teacher pages
    if (['dashboard.html', 'teacher-add-result.html', 'teacher-view-results.html'].includes(currentPage) && role !== 'teacher') {
        window.location.href = 'index.html';
        return;
    }
    
    if (currentPage === 'teacher-profile.html' && role !== 'teacher') {
        window.location.href = 'index.html';
        return;
    }
    
    // Student pages
    if (['student.html', 'student-check-result.html'].includes(currentPage) && role !== 'student') {
        window.location.href = 'index.html';
        return;
    }
}

function redirectIfLoggedIn() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('role');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // If already logged in and on login page, redirect to dashboard
    if (isLoggedIn && (currentPage === 'index.html' || currentPage === '')) {
        if (role === 'teacher') {
            window.location.href = 'dashboard.html';
        } else if (role === 'student') {
            window.location.href = 'student.html';
        }
    }
}

// ====================
// GLOBAL STATE
// ====================

let allStudents = [];

// Initialize all pages
document.addEventListener('DOMContentLoaded', function() {
    // First check: redirect if already logged in on login page
    redirectIfLoggedIn();
    
    // Second check: protect all pages from unauthorized access
    protectPage();
    
    // Load all students from localStorage
    loadStudents();
    
    // Initialize theme
    initThemeToggle();
    
    // Setup navbar
    setupNavbar();
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Update user display in navbar
    updateUserDisplay();
    
    // Setup login form if on login page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginForm);
    }
    
    // Detect which page we're on and initialize accordingly
    if (document.getElementById('addStudentResultForm')) {
        initTeacherAddForm();
    } else if (document.getElementById('addResultForm')) {
        // Student form  on student-check-result.html
        initAddResultForm();
    }
    
    if (document.getElementById('allResultsContainer')) {
        initTeacherViewResults();
    } else if (document.getElementById('resultsContainer') && document.getElementById('resultsSearch')) {
        // Student view results on student-check-result.html
        initStudentViewResults();
    }
    
    if (document.getElementById('teacherProfileForm')) {
        initTeacherProfile();
    }
});

function updateUserDisplay() {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const userDisplay = document.getElementById('userDisplay');
    
    if (userDisplay && username) {
        userDisplay.innerHTML = `<i class="fas fa-user-circle"></i> ${username} (${role})`;
    }
}

// ====================
// LOAD & SAVE STUDENTS FROM LOCALSTORAGE
// ====================

function loadStudents() {
    const stored = localStorage.getItem('students');
    allStudents = stored ? JSON.parse(stored) : [];
}

function saveStudents() {
    localStorage.setItem('students', JSON.stringify(allStudents));
}

// ====================
// TEACHER: ADD RESULT
// ====================

function initTeacherAddForm() {
    const form = document.getElementById('addStudentResultForm');
    form.addEventListener('submit', submitStudentResult);
    
    // Load default date to today
    document.getElementById('examDate').valueAsDate = new Date();
    
    // Display recent additions
    displayRecentAdditions();
}

function removeSubjectRow(button) {
    const rows = document.querySelectorAll('.subject-input-row');
    if (rows.length > 1) {
        button.parentElement.remove();
    } else {
        showToast('At least one subject is required', 'error');
    }
}

function addSubjectRow() {
    const container = document.getElementById('subjectsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'subject-input-row';
    newRow.innerHTML = `
        <div class="form-group">
            <label>Subject Name <span class="required">*</span></label>
            <input type="text" class="subject-name" placeholder="e.g., Science" required>
        </div>
        <div class="form-group">
            <label>Marks Obtained <span class="required">*</span></label>
            <input type="number" class="subject-marks" min="0" max="100" placeholder="0-100" required>
        </div>
        <div class="form-group">
            <label>Total Marks <span class="required">*</span></label>
            <input type="number" class="subject-total" min="1" placeholder="100" value="100" required>
        </div>
        <button type="button" class="btn-remove-subject" onclick="removeSubjectRow(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(newRow);
}

function resetForm() {
    document.getElementById('addStudentResultForm').reset();
    document.getElementById('examDate').valueAsDate = new Date();
    
    // Remove extra subject rows
    const container = document.getElementById('subjectsContainer');
    const rows = container.querySelectorAll('.subject-input-row');
    rows.forEach((row, index) => {
        if (index > 0) row.remove();
    });
    
    clearErrors();
}

function clearErrors() {
    document.getElementById('nameError').textContent = '';
    document.getElementById('rollError').textContent = '';
}

function submitStudentResult(e) {
    e.preventDefault();
    
    clearErrors();
    
    const studentName = document.getElementById('studentName').value.trim();
    const rollNumber = document.getElementById('rollNumber').value.trim();
    const examName = document.getElementById('examName').value.trim();
    const examDate = document.getElementById('examDate').value;
    
    // Validation
    if (!studentName) {
        document.getElementById('nameError').textContent = 'Student name is required';
        return;
    }
    
    if (!rollNumber) {
        document.getElementById('rollError').textContent = 'Roll number is required';
        return;
    }
    
    if (!examName || !examDate) {
        showToast('Please fill all exam details', 'error');
        return;
    }
    
    // Check for duplicate roll number
    const existingStudent = allStudents.find(s => s.rollNumber === rollNumber);
    if (existingStudent) {
        document.getElementById('rollError').textContent = 'Result already exists for this roll number!';
        showToast('⚠️ This student already has a result added', 'warning');
        return;
    }
    
    // Collect subject data
    const subjectRows = document.querySelectorAll('.subject-input-row');
    const subjects = [];
    
    subjectRows.forEach(row => {
        const name = row.querySelector('.subject-name').value.trim();
        const obtained = parseFloat(row.querySelector('.subject-marks').value);
        const total = parseFloat(row.querySelector('.subject-total').value);
        
        if (!name || isNaN(obtained) || isNaN(total)) {
            showToast('Please fill all subject fields', 'error');
            return;
        }
        
        if (obtained > total) {
            showToast('Obtained marks cannot exceed total marks', 'error');
            return;
        }
        
        subjects.push({
            name: name,
            obtained: obtained,
            total: total,
            percentage: ((obtained / total) * 100).toFixed(1),
            grade: getGrade((obtained / total) * 100)
        });
    });
    
    if (subjects.length === 0) {
        showToast('Please add at least one subject', 'error');
        return;
    }
    
    // Create student record
    const studentRecord = {
        id: generateId(),
        studentName: studentName,
        rollNumber: rollNumber,
        examName: examName,
        examDate: examDate,
        subjects: subjects,
        avgPercentage: calculateAvgPercentage(subjects),
        avgGrade: getAverageGrade(subjects.map(s => s.grade)),
        createdAt: new Date().toISOString()
    };
    
    // Add to array and save
    allStudents.push(studentRecord);
    saveStudents();
    
    showToast(`✅ Result added for ${studentName} (${rollNumber})`, 'success');
    resetForm();
    displayRecentAdditions();
}

function displayRecentAdditions() {
    const container = document.getElementById('recentAdditionsContainer');
    
    if (allStudents.length === 0) {
        container.innerHTML = '<p class="empty-state">No results added yet.</p>';
        return;
    }
    
    const recentResults = allStudents.slice(-3).reverse();
    let html = '';
    
    recentResults.forEach(student => {
        const date = new Date(student.examDate).toLocaleDateString();
        html += `
            <div class="result-row" onclick="viewStudentDetails('${student.id}')">
                <div>
                    <div class="result-exam-name">${student.studentName}</div>
                    <div class="result-date">Roll: ${student.rollNumber} | ${student.examName} | ${date}</div>
                </div>
                <div class="result-avg">${student.avgPercentage.toFixed(1)}%</div>
                <div class="result-grade"><span class="grade-${student.avgGrade.toLowerCase()}">${student.avgGrade}</span></div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ====================
// STUDENT: SEARCH RESULT
// ====================

function initStudentSearchForm() {
    const searchInput = document.getElementById('searchRollNumber');
    const searchBtn = document.getElementById('searchBtn');
    
    // Allow Enter key to search
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchStudentResult();
        }
    });
    
    searchBtn.addEventListener('click', searchStudentResult);
}

function searchStudentResult() {
    const rollNumber = document.getElementById('searchRollNumber').value.trim();
    const container = document.getElementById('resultsContainer');
    const spinner = document.getElementById('loadingSpinner');
    
    if (!rollNumber) {
        showToast('Please enter a roll number', 'error');
        return;
    }
    
    // Show loading
    spinner.classList.add('show');
    document.getElementById('resultsContainer').innerHTML = '';
    
    // Simulate search delay for better UX
    setTimeout(() => {
        spinner.classList.remove('show');
        
        // DYNAMIC SEARCH - No hardcoded values
        const student = allStudents.find(s => s.rollNumber === rollNumber);
        
        if (student) {
            displayStudentResult(student);
        } else {
            container.innerHTML = `
                <p class="empty-state">
                    <i class="fas fa-times-circle"></i>
                    <br>No result found for roll number: <strong>${rollNumber}</strong>
                    <br><small>Please check the roll number and try again.</small>
                </p>
            `;
        }
    }, 600);
}

function displayStudentResult(student) {
    const container = document.getElementById('resultsContainer');
    
    let subjectsHtml = '';
    student.subjects.forEach(subject => {
        subjectsHtml += `
            <div class="subject-item">
                <span class="subject-name">${subject.name}</span>
                <div class="subject-marks">
                    <span>${subject.obtained}/${subject.total}</span>
                    <span class="subject-percentage grade-${subject.grade.toLowerCase()}">${subject.percentage}% (${subject.grade})</span>
                </div>
            </div>
        `;
    });
    
    const formattedDate = new Date(student.examDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const resultHtml = `
        <div class="result-card-large">
            <div class="result-card-header">
                <div class="result-student-info">
                    <h2>${student.studentName}</h2>
                    <p class="roll-number">Roll Number: <strong>${student.rollNumber}</strong></p>
                </div>
                <div class="result-card-actions">
                    <button class="btn-card-action print" onclick="printResult('${student.id}')" title="Print">
                        <i class="fas fa-print"></i>
                    </button>
                    <button class="btn-card-action download" onclick="downloadResultPDF('${student.id}')" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
            
            <div class="exam-info">
                <h4>${student.examName}</h4>
                <p>${formattedDate}</p>
            </div>
            
            <div class="result-subjects">
                <h4 style="margin-bottom: 1rem;">Subject Details</h4>
                ${subjectsHtml}
            </div>
            
            <div class="result-summary-large">
                <div class="summary-item-large">
                    <p>Overall Percentage</p>
                    <h3>${student.avgPercentage.toFixed(1)}%</h3>
                </div>
                <div class="summary-item-large">
                    <p>Overall Grade</p>
                    <h3 class="grade-${student.avgGrade.toLowerCase()}">${student.avgGrade}</h3>
                </div>
                <div class="summary-item-large">
                    <p>Total Subjects</p>
                    <h3>${student.subjects.length}</h3>
                </div>
            </div>
            
            <div class="result-footer">
                <small>Result ID: ${student.id}</small>
            </div>
        </div>
    `;
    
    container.innerHTML = resultHtml;
}

// ====================
// TEACHER: VIEW ALL RESULTS
// ====================

function initTeacherViewResults() {
    displayAllResults();
    
    const searchInput = document.getElementById('resultsSearch');
    if (searchInput) {
        searchInput.addEventListener('input', displayAllResults);
    }
    
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', downloadAllResults);
    }
    
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllResults);
    }
}

function displayAllResults() {
    const container = document.getElementById('allResultsContainer');
    const searchTerm = document.getElementById('resultsSearch')?.value.toLowerCase() || '';
    
    let filtered = allStudents;
    
    if (searchTerm) {
        filtered = filtered.filter(s => 
            s.studentName.toLowerCase().includes(searchTerm) || 
            s.rollNumber.toLowerCase().includes(searchTerm)
        );
    }
    
    updateStats();
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">No results found. <a href="teacher-add-result.html">Add a result</a></p>';
        return;
    }
    
    let html = '';
    filtered.forEach(student => {
        html += `
            <div class="result-card" onclick="viewStudentDetails('${student.id}')">
                <div class="result-card-header">
                    <div class="result-exam-info">
                        <h4>${student.studentName}</h4>
                        <p>Roll: ${student.rollNumber} | ${student.examName}</p>
                    </div>
                    <div class="result-card-actions">
                        <button class="btn-card-action" onclick="event.stopPropagation(); deleteResult('${student.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="result-subjects" style="margin: 1rem 0;">
                    <p><strong>${student.subjects.length}</strong> subjects</p>
                </div>
                <div class="result-summary">
                    <div class="summary-item">
                        <p>Percentage</p>
                        <h5>${student.avgPercentage.toFixed(1)}%</h5>
                    </div>
                    <div class="summary-item">
                        <p>Grade</p>
                        <h5 class="grade-${student.avgGrade.toLowerCase()}">${student.avgGrade}</h5>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateStats() {
    const uniqueStudents = new Set(allStudents.map(s => s.rollNumber)).size;
    document.getElementById('totalStudentsCount').textContent = uniqueStudents;
    document.getElementById('totalResultsCount').textContent = allStudents.length;
}

function deleteResult(resultId) {
    if (confirm('Are you sure you want to delete this result?')) {
        allStudents = allStudents.filter(s => s.id !== resultId);
        saveStudents();
        showToast('Result deleted successfully!', 'success');
        displayAllResults();
    }
}

function clearAllResults() {
    if (confirm('⚠️ Are you sure you want to DELETE ALL results? This cannot be undone!')) {
        allStudents = [];
        saveStudents();
        showToast('All results cleared!', 'success');
        displayAllResults();
    }
}

// ====================
// VIEW STUDENT DETAILS
// ====================

function viewStudentDetails(resultId) {
    const student = allStudents.find(s => s.id === resultId);
    if (!student) return;
    
    let subjectsHtml = '';
    student.subjects.forEach(subject => {
        subjectsHtml += `
            <div class="subject-item">
                <span class="subject-name"><strong>${subject.name}</strong></span>
                <div class="subject-marks">
                    <span>${subject.obtained} / ${subject.total}</span>
                    <span class="subject-percentage grade-${subject.grade.toLowerCase()}">${subject.percentage}% (${subject.grade})</span>
                </div>
            </div>
        `;
    });
    
    const formattedDate = new Date(student.examDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const modalContent = `
        <div>
            <p><strong>Name:</strong> ${student.studentName}</p>
            <p><strong>Roll Number:</strong> ${student.rollNumber}</p>
            <p><strong>Exam:</strong> ${student.examName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Overall Percentage:</strong> ${student.avgPercentage.toFixed(1)}%</p>
            <p><strong>Overall Grade:</strong> <span class="grade-${student.avgGrade.toLowerCase()}">${student.avgGrade}</span></p>
        </div>
        <div>
            <h4>Subject Details</h4>
            <div class="result-subjects">
                ${subjectsHtml}
            </div>
        </div>
    `;
    
    alert(`${student.studentName}\nRoll: ${student.rollNumber}\n\n${student.examName}\nPercentage: ${student.avgPercentage.toFixed(1)}%\nGrade: ${student.avgGrade}\n\nSubjects: ${student.subjects.length}`);
}

// ====================
// PRINT & DOWNLOAD
// ====================

function printResult(resultId) {
    const student = allStudents.find(s => s.id === resultId);
    if (!student) return;
    
    const content = generateResultContent(student);
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
}

function downloadResultPDF(resultId) {
    const student = allStudents.find(s => s.id === resultId);
    if (!student) return;
    
    const content = generateResultContent(student);
    const element = document.createElement('div');
    element.innerHTML = content;
    
    const opt = {
        margin: 10,
        filename: `${student.rollNumber}-result.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save();
        showToast('PDF downloaded successfully!', 'success');
    } else {
        showToast('PDF library not available. Please check your internet connection.', 'warning');
    }
}

function downloadAllResults() {
    if (allStudents.length === 0) {
        showToast('No results to download', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(allStudents, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all-results-${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('Results exported successfully!', 'success');
}

function generateResultContent(student) {
    const formattedDate = new Date(student.examDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let subjectsTable = '';
    student.subjects.forEach(subject => {
        subjectsTable += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${subject.name}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${subject.obtained}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${subject.total}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${subject.percentage}%</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${subject.grade}</td>
            </tr>
        `;
    });
    
    return `
        <div style="font-family: 'Poppins', Arial, sans-serif; padding: 20px;">
            <h2 style="text-align: center; color: #333;">Student Result Report</h2>
            <hr>
            <div style="margin-bottom: 20px;">
                <p><strong>Student Name:</strong> ${student.studentName}</p>
                <p><strong>Roll Number:</strong> ${student.rollNumber}</p>
                <p><strong>Exam Name:</strong> ${student.examName}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
            </div>
            <h3>Subject Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background-color: #f0f0f0;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Subject</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>Obtained</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>Total</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>Percentage</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>Grade</strong></td>
                </tr>
                ${subjectsTable}
            </table>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p><strong>Overall Percentage:</strong> ${student.avgPercentage.toFixed(1)}%</p>
                <p><strong>Overall Grade:</strong> ${student.avgGrade}</p>
            </div>
            <p style="text-align: center; margin-top: 30px; color: #666; font-size: 0.9em;">
                Generated on ${new Date().toLocaleString()}
            </p>
        </div>
    `;
}

// ====================
// UTILITY FUNCTIONS
// ====================

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

function getAverageGrade(grades) {
    if (!grades || grades.length === 0) return 'F';
    const gradeValues = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
    const sum = grades.reduce((acc, grade) => acc + (gradeValues[grade] || 0), 0);
    const avg = sum / grades.length;
    if (avg >= 3.5) return 'A';
    if (avg >= 2.5) return 'B';
    if (avg >= 1.5) return 'C';
    if (avg >= 0.5) return 'D';
    return 'F';
}

function calculateAvgPercentage(subjects) {
    if (!subjects || subjects.length === 0) return 0;
    const sum = subjects.reduce((acc, subject) => acc + subject.percentage, 0);
    return sum / subjects.length;
}

// ====================
// THEME & NAVBAR
// ====================

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    themeToggle.addEventListener('click', function () {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

function setupNavbar() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.navbar-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
        
        // Close menu when link is clicked
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                navMenu.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }
}

// ====================
// UTILITY FUNCTIONS
// ====================

function generateId() {
    return 'result_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

function getAverageGrade(grades) {
    if (grades.length === 0) return 'N/A';

    const gradePoints = {
        'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
    };

    const totalPoints = grades.reduce((sum, grade) => sum + gradePoints[grade], 0);
    const averagePoints = totalPoints / grades.length;

    if (averagePoints >= 3.75) return 'A';
    if (averagePoints >= 3.0) return 'B';
    if (averagePoints >= 2.0) return 'C';
    if (averagePoints >= 1.0) return 'D';
    return 'F';
}

function calculateAvgPercentage(subjects) {
    if (subjects.length === 0) return 0;
    const total = subjects.reduce((sum, s) => sum + ((s.obtained / s.total) * 100), 0);
    return total / subjects.length;
}

// ====================
// TEACHER PROFILE MANAGEMENT
// ====================

function initTeacherProfile() {
    loadTeacherProfile();
    const form = document.getElementById('teacherProfileForm');
    if (form) {
        form.addEventListener('submit', saveTeacherProfile);
    }
}

function loadTeacherProfile() {
    const username = localStorage.getItem('username');
    const profileData = localStorage.getItem(`teacher-profile-${username}`);
    
    if (profileData) {
        const profile = JSON.parse(profileData);
        document.getElementById('profileName').value = profile.name || '';
        document.getElementById('profileEmail').value = profile.email || '';
        document.getElementById('profileDepartment').value = profile.department || '';
        document.getElementById('profileExperience').value = profile.experience || '';
    } else {
        document.getElementById('profileName').value = username;
    }
}

function saveTeacherProfile(e) {
    e.preventDefault();
    
    const username = localStorage.getItem('username');
    const profile = {
        name: document.getElementById('profileName').value || '',
        email: document.getElementById('profileEmail').value || '',
        department: document.getElementById('profileDepartment').value || '',
        experience: document.getElementById('profileExperience').value || ''
    };
    
    if (!profile.name || !profile.email) {
        showToast('Please fill in name and email', 'error');
        return;
    }
    
    localStorage.setItem(`teacher-profile-${username}`, JSON.stringify(profile));
    showToast('✅ Profile saved successfully!', 'success');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return; // Toast element might not exist on all pages
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ====================
// PAGE INITIALIZATION
// ====================
// All initialization is now handled in the consolidated DOMContentLoaded event above
