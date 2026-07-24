/* 
   All In One (AIO) — Landing Page Script
 */

/* ── Smooth Scroll ── */
function scrollToId(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const AIO_CONTACT = {
  whatsapp: '201025849793',
  defaultMessage: 'مرحبًا فريق AIO، أرغب في معرفة المزيد عن المنصة والخدمات المتاحة، وأريد حجز Demo لمناقشة احتياجات شركتي.'
};

function openWhatsApp(message) {
  const text = message || AIO_CONTACT.defaultMessage;
  const url = 'https://wa.me/' + AIO_CONTACT.whatsapp + '?text=' + encodeURIComponent(text);
  window.open(url, '_blank', 'noopener,noreferrer');
}

function openLeadModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('on');
  document.body.style.overflow = 'hidden';
  const firstInput = modal.querySelector('input, select, textarea');
  if (firstInput) window.setTimeout(function () { firstInput.focus(); }, 50);
}

function closeLeadModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('on');
  document.body.style.overflow = '';
}

function formValue(data, key) {
  return String(data.get(key) || '').trim();
}

function submitLeadForm(event, type) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  let lines;

  if (type === 'demo') {
    lines = [
      'مرحبًا فريق AIO، أرغب في حجز Demo.',
      '',
      'الاسم: ' + formValue(data, 'name'),
      'البريد الإلكتروني: ' + formValue(data, 'email'),
      'الهاتف / WhatsApp: ' + formValue(data, 'phone'),
      'الشركة أو المؤسسة: ' + formValue(data, 'company'),
      'نوع المؤسسة: ' + formValue(data, 'organizationType'),
      'عدد المستخدمين المتوقع: ' + formValue(data, 'expectedUsers'),
      'المميزات المطلوبة: ' + formValue(data, 'features'),
      'وقت التواصل المناسب: ' + formValue(data, 'contactTime'),
      'تفاصيل إضافية: ' + (formValue(data, 'details') || 'لا يوجد')
    ];
  } else {
    lines = [
      'مرحبًا فريق AIO، لدي استفسار عن المنصة.',
      '',
      'الاسم: ' + formValue(data, 'name'),
      'البريد الإلكتروني: ' + formValue(data, 'email'),
      'الهاتف: ' + formValue(data, 'phone'),
      'الشركة أو المؤسسة: ' + (formValue(data, 'company') || 'غير محدد'),
      'الموضوع: ' + formValue(data, 'subject'),
      'التفاصيل: ' + formValue(data, 'details')
    ];
  }

  closeLeadModal(type === 'demo' ? 'demo-modal' : 'contact-modal');
  openWhatsApp(lines.join('\n'));
}

/* ── Auth Modal ── */
function openAuth(tab) {
  window.location.href = tab === 'login' ? '/login' : '/workspace';
  return;
  document.getElementById('authOverlay').classList.add('on');
  switchTab(tab);
}

function closeAuth() {
  document.getElementById('authOverlay').classList.remove('on');
}

function switchTab(tab) {
  document.getElementById('tabSignup').classList.toggle('on', tab === 'signup');
  document.getElementById('tabLogin').classList.toggle('on', tab === 'login');
  document.getElementById('signupTab').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('loginTab').style.display = tab === 'login' ? 'block' : 'none';
}

/*  Pricing Toggle */
document.addEventListener('DOMContentLoaded', function () {
  const ptBtns = document.querySelectorAll('.pt-btn');
  const prices = {
    monthly: {
      Starter: ['500', 'جنيه / شهر'],
      Growth: ['1,200', 'جنيه / شهر'],
      Pro: ['2,500', 'جنيه / شهر']
    },
    yearly: {
      Starter: ['4,800', 'جنيه / سنة'],
      Growth: ['11,520', 'جنيه / سنة'],
      Pro: ['24,000', 'جنيه / سنة']
    }
  };

  function updatePricing(period) {
    document.querySelectorAll('.price-card').forEach(function (card) {
      const plan = card.querySelector('.price-name');
      const amount = card.querySelector('.price-amt');
      const per = card.querySelector('.price-per');
      if (!plan || !amount || !per || !prices[period][plan.textContent.trim()]) return;
      amount.textContent = prices[period][plan.textContent.trim()][0];
      per.textContent = prices[period][plan.textContent.trim()][1];
    });
  }

  ptBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      ptBtns.forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
      updatePricing(btn.textContent.indexOf('سنوي') !== -1 ? 'yearly' : 'monthly');
    });
  });
});

/*  Onboarding Flow  */
function startOnboarding() {
  window.location.href = '/workspace';
  return;
  closeAuth();
  document.getElementById('marketing-page').style.display = 'none';
  document.getElementById('onboardFlow').classList.add('on');
  window.scrollTo(0, 0);
  updatePreview();
}

function closeOnboarding() {
  document.getElementById('onboardFlow').classList.remove('on');
  document.getElementById('marketing-page').style.display = 'block';
}

function goToDashboard() {
  window.location.href = '/workspace';
}

/*  Color Picker  */
let currentColor = '#4F46E5';

function selectColor(el, color) {
  document.querySelectorAll('.color-dot').forEach(function (d) { d.classList.remove('on'); });
  el.classList.add('on');
  currentColor = color;
  updatePreview();
}

/*  Logo Upload Preview  */
function previewLogo(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    document.getElementById('logoUploadPrompt').style.display = 'none';
    document.getElementById('logoPreviewWrap').style.display = 'block';
    const img = document.createElement('img');
    img.src = ev.target.result;
    img.style.cssText = 'width:88px;height:88px;border-radius:18px;object-fit:cover;margin:0 auto 14px;display:block;box-shadow:var(--sh)';
    const wrap = document.getElementById('logoPreviewWrap');
    wrap.innerHTML = '';
    wrap.appendChild(img);
    document.getElementById('prevLogo').innerHTML =
      '<img src="' + ev.target.result + '" style="width:100%;height:100%;object-fit:cover;border-radius:11px">';
  };
  reader.readAsDataURL(file);
}

/*  Live Preview (Step 1)  */
function updatePreview() {
  const name = document.getElementById('ob-company-name').value || 'اسم الشركة';
  const bio  = document.getElementById('ob-bio').value || 'بدون نبذة بعد...';
  document.getElementById('prevName').textContent = name;
  document.getElementById('prevBio').textContent  = bio;
  document.getElementById('prevLogo').style.background = currentColor;
  const initials = name.split(' ').slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  const prevLogo = document.getElementById('prevLogo');
  if (!prevLogo.querySelector('img')) {
    prevLogo.textContent = initials || 'TE';
  }
}

function updateBioCounter() {
  const len = document.getElementById('ob-bio').value.length;
  document.getElementById('bioCounter').textContent = len + '/180';
  updatePreview();
}

/*  Plan Selection (Step 3)  */
function selectPlan(el) {
  document.querySelectorAll('.plan-opt').forEach(function (p) { p.classList.remove('on'); });
  el.classList.add('on');
  const price = el.querySelector('.plan-opt-price').textContent;
  document.getElementById('planPriceLabel').textContent = price;
}

/*  Step Navigation  */
function goStep(n) {
  document.querySelectorAll('.flow-step-page').forEach(function (p) { p.style.display = 'none'; });
  document.getElementById('ob-step-' + n).style.display = 'block';
  for (let i = 1; i <= 4; i++) {
    document.getElementById('fs' + i).classList.toggle('done', i <= n);
  }
  if (n === 4) {
    document.getElementById('prevLogo2').style.background = currentColor;
    document.getElementById('prevLogo2').innerHTML = document.getElementById('prevLogo').innerHTML;
    document.getElementById('prevName2').textContent =
      document.getElementById('ob-company-name').value || 'اسم الشركة';
  }
  window.scrollTo(0, 0);
}

/*  Init  */
document.addEventListener('DOMContentLoaded', function () {
  updateBioCounter();

  document.querySelectorAll('.lead-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closeLeadModal(overlay.id);
    });
  });
});

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.lead-overlay.on').forEach(function (overlay) {
    closeLeadModal(overlay.id);
  });
});
