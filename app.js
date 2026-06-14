// Data Storage Keys
const ACTIVITIES_KEY = 'sharjah_summer_activities';
const BOOKINGS_KEY = 'sharjah_summer_bookings';

// Default Activities if none exist
const defaultActivities = [
    { id: '1', name: 'كرة القدم للناشئين', category: 'برامج', date: '2026-07-01', time: '16:00', location: 'الملعب العشبي', notes: '' },
    { id: '2', name: 'السباحة', category: 'برامج', date: '2026-07-02', time: '10:00', location: 'المسبح الأولمبي', notes: '' },
    { id: '3', name: 'رحلة متحف الشارقة', category: 'رحلات_ميدانية', date: '2026-07-10', time: '08:00', location: 'متحف الشارقة', notes: 'تجمع عند البوابة الرئيسية' },
    { id: '4', name: 'حديقة المنتزه', category: 'رحلات_ترفيهية', date: '2026-07-15', time: '09:00', location: 'المنتزه', notes: '' }
];

// Initialize Data
let activities = JSON.parse(localStorage.getItem(ACTIVITIES_KEY));
if (!activities) {
    activities = defaultActivities;
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
}

let bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
let chartInstance = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    
    // Setup Navigation
    const btnBooking = document.getElementById('btn-booking-portal');
    const btnAdmin = document.getElementById('btn-admin-portal');
    const secBooking = document.getElementById('section-booking');
    const secLogin = document.getElementById('section-admin-login');
    const secDashboard = document.getElementById('section-admin-dashboard');

    btnBooking.addEventListener('click', () => {
        btnBooking.classList.add('active');
        btnAdmin.classList.remove('active');
        secBooking.classList.remove('hidden');
        secBooking.classList.add('active');
        secLogin.classList.add('hidden');
        secLogin.classList.remove('active');
        secDashboard.classList.add('hidden');
        secDashboard.classList.remove('active');
    });

    btnAdmin.addEventListener('click', () => {
        btnAdmin.classList.add('active');
        btnBooking.classList.remove('active');
        secBooking.classList.add('hidden');
        secBooking.classList.remove('active');
        
        // Check if already logged in via session
        if (sessionStorage.getItem('adminLoggedIn') === 'true') {
            showDashboard();
        } else {
            secLogin.classList.remove('hidden');
            secLogin.classList.add('active');
        }
    });

    // Booking Form Logic
    const interestCategory = document.getElementById('interestCategory');
    const selectedActivity = document.getElementById('selectedActivity');
    
    interestCategory.addEventListener('change', (e) => {
        const category = e.target.value;
        selectedActivity.innerHTML = '<option value="">اختر النشاط...</option>';
        selectedActivity.disabled = true;
        
        if (category) {
            const filteredActs = activities.filter(a => a.category === category);
            if (filteredActs.length > 0) {
                filteredActs.forEach(act => {
                    const opt = document.createElement('option');
                    opt.value = act.id;
                    opt.textContent = `${act.name} (${act.date})`;
                    selectedActivity.appendChild(opt);
                });
                selectedActivity.disabled = false;
            } else {
                selectedActivity.innerHTML = '<option value="">لا توجد أنشطة متاحة حالياً لهذه الفئة</option>';
            }
        }
    });

    const bookingForm = document.getElementById('bookingForm');
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const booking = {
            id: 'BKG-' + Math.floor(Math.random() * 1000000),
            name: document.getElementById('participantName').value,
            phone: document.getElementById('participantPhone').value,
            age: document.getElementById('participantAge').value,
            category: document.getElementById('interestCategory').value,
            activityId: document.getElementById('selectedActivity').value,
            notes: document.getElementById('participantNotes').value,
            timestamp: new Date().toISOString()
        };
        
        bookings.push(booking);
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
        
        document.getElementById('bookingRef').textContent = booking.id;
        document.getElementById('bookingSuccess').classList.remove('hidden');
        bookingForm.reset();
        selectedActivity.disabled = true;
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            document.getElementById('bookingSuccess').classList.add('hidden');
        }, 5000);
    });

    // Admin Login Logic
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('adminUser').value;
        const pass = document.getElementById('adminPass').value;
        
        if (user === 'admin' && pass === 'sharjah2026') {
            sessionStorage.setItem('adminLoggedIn', 'true');
            showDashboard();
            document.getElementById('loginError').classList.add('hidden');
            loginForm.reset();
        } else {
            document.getElementById('loginError').classList.remove('hidden');
        }
    });

    document.getElementById('btnLogout').addEventListener('click', () => {
        sessionStorage.removeItem('adminLoggedIn');
        secDashboard.classList.remove('active');
        secDashboard.classList.add('hidden');
        secLogin.classList.remove('hidden');
        secLogin.classList.add('active');
    });

    // Admin Dashboard Logic
    const activityForm = document.getElementById('activityForm');
    activityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newAct = {
            id: 'ACT-' + Date.now(),
            name: document.getElementById('actName').value,
            category: document.getElementById('actCategory').value,
            date: document.getElementById('actDate').value,
            time: document.getElementById('actTime').value,
            location: document.getElementById('actLocation').value,
            notes: document.getElementById('actNotes').value
        };
        
        activities.push(newAct);
        localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
        activityForm.reset();
        
        refreshDashboard();
    });

    document.getElementById('btnExportExcel').addEventListener('click', exportToExcel);
});

function showDashboard() {
    document.getElementById('section-admin-login').classList.remove('active');
    document.getElementById('section-admin-login').classList.add('hidden');
    
    const dashboard = document.getElementById('section-admin-dashboard');
    dashboard.classList.remove('hidden');
    dashboard.classList.add('active');
    
    refreshDashboard();
}

function refreshDashboard() {
    updateKPIs();
    updateTables();
    renderChart();
}

function updateKPIs() {
    document.getElementById('kpiTotalParticipants').textContent = bookings.length;
    
    const progCount = bookings.filter(b => b.category === 'برامج').length;
    const fieldCount = bookings.filter(b => b.category === 'رحلات_ميدانية').length;
    const recCount = bookings.filter(b => b.category === 'رحلات_ترفيهية').length;
    
    document.getElementById('kpiPrograms').textContent = progCount;
    document.getElementById('kpiFieldTrips').textContent = fieldCount;
    document.getElementById('kpiRecTrips').textContent = recCount;
}

function updateTables() {
    // Bookings Table
    const tbodyB = document.getElementById('bookingsTableBody');
    tbodyB.innerHTML = '';
    
    // Sort bookings by newest first
    const sortedBookings = [...bookings].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedBookings.forEach(b => {
        const act = activities.find(a => a.id === b.activityId);
        const actName = act ? act.name : 'محذوف';
        
        let catText = b.category;
        if(catText === 'برامج') catText = 'البرامج الرياضية';
        if(catText === 'رحلات_ميدانية') catText = 'الرحلات الميدانية';
        if(catText === 'رحلات_ترفيهية') catText = 'الرحلات الترفيهية';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${b.id}</td>
            <td>${b.name}</td>
            <td>${b.age}</td>
            <td>${b.phone}</td>
            <td>${catText}</td>
            <td>${actName}</td>
            <td>${new Date(b.timestamp).toLocaleDateString('ar-AE')}</td>
        `;
        tbodyB.appendChild(tr);
    });

    // Activities Table
    const tbodyA = document.getElementById('activitiesTableBody');
    tbodyA.innerHTML = '';
    
    activities.forEach(a => {
        let catText = a.category;
        if(catText === 'برامج') catText = 'البرامج الرياضية';
        if(catText === 'رحلات_ميدانية') catText = 'الرحلات الميدانية';
        if(catText === 'رحلات_ترفيهية') catText = 'الرحلات الترفيهية';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${a.name}</td>
            <td>${catText}</td>
            <td>${a.location}</td>
            <td dir="ltr">${a.date} ${a.time}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteActivity('${a.id}')">حذف</button>
            </td>
        `;
        tbodyA.appendChild(tr);
    });
}

window.deleteActivity = function(id) {
    if(confirm('هل أنت متأكد من حذف هذا النشاط؟')) {
        activities = activities.filter(a => a.id !== id);
        localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
        refreshDashboard();
    }
};

function renderChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    const data = [
        bookings.filter(b => b.category === 'برامج').length,
        bookings.filter(b => b.category === 'رحلات_ميدانية').length,
        bookings.filter(b => b.category === 'رحلات_ترفيهية').length
    ];

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['البرامج الرياضية', 'الرحلات الميدانية', 'الرحلات الترفيهية'],
            datasets: [{
                data: data,
                backgroundColor: ['#0F4C81', '#D4AF37', '#28a745'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Tajawal' } }
                }
            }
        }
    });
}

function exportToExcel() {
    const data = bookings.map(b => {
        const act = activities.find(a => a.id === b.activityId);
        let catText = b.category;
        if(catText === 'برامج') catText = 'البرامج الرياضية';
        if(catText === 'رحلات_ميدانية') catText = 'الرحلات الميدانية';
        if(catText === 'رحلات_ترفيهية') catText = 'الرحلات الترفيهية';

        return {
            'رقم الحجز': b.id,
            'الاسم الرباعي': b.name,
            'رقم الهاتف': b.phone,
            'العمر': b.age,
            'نوع الاهتمام': catText,
            'اسم النشاط': act ? act.name : 'غير معروف',
            'التاريخ': new Date(b.timestamp).toLocaleString('ar-AE'),
            'الملاحظات': b.notes || 'لا يوجد'
        };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add RTL to sheet
    ws['!dir'] = 'rtl';
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المشاركين");
    
    XLSX.writeFile(wb, "Sharjah_Summer_Program_Bookings.xlsx");
}
