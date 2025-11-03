// script.js
// Template sederhana: menambahkan baris, merender preview, kirim ke Telegram
// Cara kerja:
// - dataRows: array objek untuk tiap baris
// - setiap input terkait row akan update dataRows dan preview
// - tombol "Kirim ke Telegram" memanggil sendToTelegram()

const tbody = document.getElementById('tbody');
const addRowBtn = document.getElementById('addRowBtn');
const clearBtn = document.getElementById('clearBtn');
const sendBtn = document.getElementById('sendBtn');
const preview = document.getElementById('preview');

const botTokenInput = document.getElementById('botToken');
const chatIdInput = document.getElementById('chatId');
const monthInput = document.getElementById('month');

let dataRows = [];

// fungsi util: buat object row kosong
function emptyRow(no){
  return {
    no: no,
    date: '',
    coin: '',
    rr: '',
    winloss: '',
    reason: '',
    mm: '',
    note: ''
  };
}

function renderTable(){
  tbody.innerHTML = '';
  if (dataRows.length === 0){
    // buat 1 baris kosong sebagai contoh
    dataRows.push(emptyRow(1));
  }
  dataRows.forEach((r, idx) => {
    const tr = document.createElement('tr');

    const tdNo = document.createElement('td');
    tdNo.textContent = r.no;
    tr.appendChild(tdNo);

    const tdDate = document.createElement('td');
    const inpDate = document.createElement('input');
    inpDate.value = r.date;
    inpDate.placeholder = 'Hari, Tanggal';
    inpDate.addEventListener('input', e => { r.date = e.target.value; updatePreview(); });
    tdDate.appendChild(inpDate);
    tr.appendChild(tdDate);

    const tdCoin = document.createElement('td');
    const taCoin = document.createElement('textarea');
    taCoin.value = r.coin;
    taCoin.placeholder = 'Coin (pisah baris jika banyak)';
    taCoin.addEventListener('input', e => { r.coin = e.target.value; updatePreview(); });
    tdCoin.appendChild(taCoin);
    tr.appendChild(tdCoin);

    const tdRR = document.createElement('td');
    const inpRR = document.createElement('input');
    inpRR.value = r.rr;
    inpRR.placeholder = 'Risk:Reward (contoh 1:2)';
    inpRR.addEventListener('input', e => { r.rr = e.target.value; updatePreview(); });
    tdRR.appendChild(inpRR);
    tr.appendChild(tdRR);

    const tdWL = document.createElement('td');
    const taWL = document.createElement('textarea');
    taWL.value = r.winloss;
    taWL.placeholder = 'Win & Loss (contoh: 40% win)';
    taWL.addEventListener('input', e => { r.winloss = e.target.value; updatePreview(); });
    tdWL.appendChild(taWL);
    tr.appendChild(tdWL);

    const tdReason = document.createElement('td');
    const taReason = document.createElement('textarea');
    taReason.value = r.reason;
    taReason.placeholder = 'Alasan win/loss';
    taReason.addEventListener('input', e => { r.reason = e.target.value; updatePreview(); });
    tdReason.appendChild(taReason);
    tr.appendChild(tdReason);

    const tdMM = document.createElement('td');
    const inpMM = document.createElement('input');
    inpMM.value = r.mm;
    inpMM.placeholder = '% modal (contoh 1% / 5%)';
    inpMM.addEventListener('input', e => { r.mm = e.target.value; updatePreview(); });
    tdMM.appendChild(inpMM);
    tr.appendChild(tdMM);

    const tdNote = document.createElement('td');
    const taNote = document.createElement('textarea');
    taNote.value = r.note;
    taNote.placeholder = 'Keterangan tambahan';
    taNote.addEventListener('input', e => { r.note = e.target.value; updatePreview(); });
    tdNote.appendChild(taNote);
    tr.appendChild(tdNote);

    tbody.appendChild(tr);
  });

  updatePreview();
}

function addRow(){
  const next = dataRows.length + 1;
  dataRows.push(emptyRow(next));
  renderTable();
}

function clearAll(){
  dataRows = [];
  renderTable();
}

// buat format pesan yang akan dikirim (MarkdownV2 safe)
function escapeMD(s){
  if (!s) return '';
  return s.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

function buildMessage(){
  const month = monthInput.value || '';
  let lines = [];
  lines.push('*LAPORAN HARIAN HASIL TRADING*');
  if (month) lines.push(`*Bulan:* ${escapeMD(month)}`);
  lines.push(''); // blank

  dataRows.forEach(r => {
    // jika seluruh fields kosong, lewati
    const allEmpty = !r.date && !r.coin && !r.rr && !r.winloss && !r.reason && !r.mm && !r.note;
    if (allEmpty) return;
    lines.push(`*NO.* ${escapeMD(String(r.no || ''))}`);
    if (r.date) lines.push(`_Hari/Tanggal:_ ${escapeMD(r.date)}`);
    if (r.coin) {
      // tampilkan coin per baris
      const coins = r.coin.split('\n').map(c => `  - ${escapeMD(c.trim())}`).join('\n');
      lines.push(`_COIN:_\n${coins}`);
    }
    if (r.rr) lines.push(`_Risk:Reward:_ ${escapeMD(r.rr)}`);
    if (r.winloss) lines.push(`_Win & Loss:_ ${escapeMD(r.winloss)}`);
    if (r.reason) lines.push(`_Alasan Win/Loss:_ ${escapeMD(r.reason)}`);
    if (r.mm) lines.push(`_MM:_ ${escapeMD(r.mm)}`);
    if (r.note) lines.push(`_Keterangan:_ ${escapeMD(r.note)}`);
    lines.push(''); // pemisah antar entry
  });

  if (lines.length <= 3) {
    return '(Kosong — belum ada data yang diisi)';
  }
  return lines.join('\n');
}

function updatePreview(){
  preview.textContent = buildMessage();
}

// kirim ke Telegram via Bot API
async function sendToTelegram(){
  const botToken = botTokenInput.value.trim();
  const chatId = chatIdInput.value.trim();
  if (!botToken || !chatId){
    alert('Isi BOT Token dan Chat ID terlebih dahulu di atas.');
    return;
  }
  const message = buildMessage();
  if (!message || message.startsWith('(')) {
    alert('Tidak ada data untuk dikirim.');
    return;
  }

  // panggil API sendMessage
  const url = `https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: message,
    parse_mode: 'MarkdownV2'
  };

  sendBtn.disabled = true;
  sendBtn.textContent = 'Mengirim...';
  try{
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (data.ok){
      alert('Berhasil dikirim ke Telegram ✅');
    } else {
      alert('Gagal mengirim: ' + (data.description || JSON.stringify(data)));
    }
  } catch(err){
    alert('Error saat mengirim: ' + err.message);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Kirim ke Telegram';
  }
}

// event binding
addRowBtn.addEventListener('click', addRow);
clearBtn.addEventListener('click', () => {
  if (confirm('Kosongkan semua baris?')) clearAll();
});
sendBtn.addEventListener('click', sendToTelegram);

// init
renderTable();