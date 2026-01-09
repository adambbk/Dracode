/* JavaScript Document

TemplateMo 606 String Master

https://templatemo.com/tm-606-string-master

*/

// Guitar configuration
const STRINGS = 6;
const FRETS = 8;
const STRING_NOTES = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Chord shapes (fret positions for each string, -1 = muted, 0 = open)
const CHORDS = {
   'C': {
      frets: [-1, 1, 0, 2, 3, -1],
      fingers: [null, 1, null, 2, 3, null]
   },
   'G': {
      frets: [3, 0, 0, 0, 2, 3],
      fingers: [2, null, null, null, 1, 3]
   },
   'Am': {
      frets: [0, 1, 2, 2, 0, -1],
      fingers: [null, 1, 2, 3, null, null]
   },
   'F': {
      frets: [1, 1, 2, 3, 3, 1],
      fingers: [1, 1, 2, 3, 4, 1]
   },
   'D': {
      frets: [2, 3, 2, 0, -1, -1],
      fingers: [1, 3, 2, null, null, null]
   },
   'Em': {
      frets: [0, 0, 0, 2, 2, 0],
      fingers: [null, null, null, 1, 2, null]
   }
};

// Songs data - [string, fret, duration in ms]
const SONGS = {
   greensleeves: {
      name: 'Greensleeves',
      tempo: 400,
      notes: [
         [2, 0, 1],
         [1, 1, 1],
         [0, 3, 2],
         [0, 5, 1],
         [0, 3, 1],
         [0, 1, 2],
         [1, 0, 1],
         [2, 0, 1],
         [1, 1, 2],
         [2, 0, 1],
         [1, 1, 1],
         [0, 0, 2],
         [0, 0, 1],
         [1, 0, 1],
         [0, 1, 2],
         [0, 3, 1],
         [0, 5, 1],
         [0, 3, 2],
         [0, 1, 1],
         [1, 0, 1],
         [2, 0, 2],
         [1, 1, 1],
         [2, 0, 1],
         [1, 1, 2]
      ]
   },
   houseoftherisingsun: {
      name: 'House of the Rising Sun',
      tempo: 350,
      notes: [
         [4, 0, 1],
         [3, 2, 1],
         [2, 2, 1],
         [1, 1, 1],
         [2, 2, 1],
         [3, 2, 1],
         [4, 2, 1],
         [3, 2, 1],
         [2, 0, 1],
         [1, 1, 1],
         [2, 0, 1],
         [3, 2, 1],
         [4, 0, 1],
         [3, 2, 1],
         [2, 1, 1],
         [1, 0, 1],
         [2, 1, 1],
         [3, 2, 1],
         [4, 2, 1],
         [3, 2, 1],
         [2, 2, 1],
         [1, 1, 1],
         [2, 2, 1],
         [3, 2, 1]
      ]
   },
   amazinggrace: {
      name: 'Amazing Grace',
      tempo: 500,
      notes: [
         [3, 0, 1],
         [2, 0, 2],
         [1, 1, 1],
         [2, 0, 1],
         [1, 1, 2],
         [1, 0, 1],
         [2, 0, 3],
         [3, 2, 1],
         [3, 0, 2],
         [2, 0, 1],
         [1, 1, 1],
         [2, 0, 1],
         [1, 1, 2],
         [0, 0, 1],
         [0, 3, 3],
         [0, 3, 1],
         [0, 0, 2],
         [1, 1, 1],
         [2, 0, 1],
         [1, 1, 2],
         [1, 0, 1],
         [2, 0, 3]
      ]
   }
};

let soundEnabled = true;
let isPlaying = false;
let currentSong = 'greensleeves';
let songTimeout = null;
let noteIndex = 0;

// Single shared AudioContext
let audioCtx = null;
let compressor = null;

function getAudioContext() {
   if (!audioCtx) {
      audioCtx = new(window.AudioContext || window.webkitAudioContext)();
      // Add compressor to prevent clipping and reduce pops
      compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressor.connect(audioCtx.destination);
   }
   // Resume if suspended (browsers require user interaction)
   if (audioCtx.state === 'suspended') {
      audioCtx.resume();
   }
   return audioCtx;
}

// Initialize fretboard
function initFretboard() {
   const fretboard = document.getElementById('fretboard');
   const grid = document.createElement('div');
   grid.style.display = 'contents';

   for (let string = 0; string < STRINGS; string++) {
      for (let fret = 0; fret < FRETS; fret++) {
         const fretEl = document.createElement('div');
         fretEl.className = 'fret';
         fretEl.dataset.string = string;
         fretEl.dataset.fret = fret;

         // Add fret markers
         if (string === 2 && [2, 4, 6].includes(fret)) {
            const marker = document.createElement('div');
            marker.className = 'fret-marker';
            fretEl.appendChild(marker);
         }

         // Add note marker
         const noteMarker = document.createElement('div');
         noteMarker.className = 'note-marker';
         noteMarker.textContent = getNoteAtPosition(string, fret);
         fretEl.appendChild(noteMarker);

         fretEl.addEventListener('click', () => playNote(string, fret));
         fretboard.appendChild(fretEl);
      }
   }
}

function getNoteAtPosition(string, fret) {
   const baseNote = STRING_NOTES[string];
   const baseNoteIndex = NOTE_NAMES.indexOf(baseNote.slice(0, -1).replace('b', '#'));
   const noteIndex = (baseNoteIndex + fret + 1) % 12;
   return NOTE_NAMES[noteIndex];
}

function getFrequency(string, fret) {
   const baseFreqs = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];
   return baseFreqs[string] * Math.pow(2, fret / 12);
}

function playNote(string, fret, showMarker = true) {
   // Visual feedback first
   if (showMarker) {
      const fretEl = document.querySelector(`[data-string="${string}"][data-fret="${fret}"]`);
      if (fretEl) {
         const marker = fretEl.querySelector('.note-marker');
         marker.classList.add('show', 'playing');
         setTimeout(() => marker.classList.remove('playing'), 300);
      }
   }

   if (!soundEnabled) return;

   try {
      const ctx = getAudioContext();
      const freq = getFrequency(string, fret);

      // Create oscillators for guitar-like tone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.value = freq;
      osc2.frequency.value = freq * 2;

      filter.type = 'lowpass';
      filter.frequency.value = 1800;
      filter.Q.value = 0.7;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      // Route through compressor to prevent clipping
      gainNode.connect(compressor);

      // Smoother guitar-like envelope with softer attack
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0.001, now);
      // Soft attack to prevent click
      gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.015);
      // Quick decay to sustain
      gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.1);
      // Gradual release
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
   } catch (e) {
      console.log('Audio error:', e);
   }
}

function showChord(chordName) {
   // Clear previous
   clearNotes();

   // Highlight active button
   document.querySelector(`[data-chord="${chordName}"]`).classList.add('active');

   const chord = CHORDS[chordName];
   const notesToPlay = [];

   chord.frets.forEach((fret, string) => {
      if (fret >= 0) {
         const actualFret = fret === 0 ? 0 : fret - 1;
         const fretEl = document.querySelector(`[data-string="${string}"][data-fret="${actualFret}"]`);
         if (fretEl) {
            const marker = fretEl.querySelector('.note-marker');
            marker.classList.add('show');
            notesToPlay.push({
               string,
               fret: actualFret
            });
         }
      }
   });

   // Play chord with strum effect
   if (soundEnabled) {
      notesToPlay.reverse().forEach((note, i) => {
         setTimeout(() => playNote(note.string, note.fret, false), i * 40);
      });
   }
}

function clearNotes() {
   document.querySelectorAll('.note-marker').forEach(m => m.classList.remove('show'));
   document.querySelectorAll('.chord-btn').forEach(b => b.classList.remove('active'));
}

// Song player functions
function playSong() {
   if (isPlaying) {
      stopSong();
      return;
   }

   // Initialize audio context on user interaction
   getAudioContext();

   isPlaying = true;
   noteIndex = 0;
   document.getElementById('playBtn').textContent = '■';
   document.getElementById('playBtn').classList.add('playing');
   playNextNote();
}

function stopSong() {
   isPlaying = false;
   if (songTimeout) {
      clearTimeout(songTimeout);
      songTimeout = null;
   }
   noteIndex = 0;
   document.getElementById('playBtn').textContent = '▶';
   document.getElementById('playBtn').classList.remove('playing');
   document.getElementById('progressBar').style.width = '0%';
   clearNotes();
}

function playNextNote() {
   if (!isPlaying) return;

   const song = SONGS[currentSong];
   if (noteIndex >= song.notes.length) {
      stopSong();
      return;
   }

   const [string, fret, duration] = song.notes[noteIndex];

   // Clear previous and play current
   clearNotes();
   const fretEl = document.querySelector(`[data-string="${string}"][data-fret="${fret}"]`);
   if (fretEl) {
      const marker = fretEl.querySelector('.note-marker');
      marker.classList.add('show', 'playing');
      playNote(string, fret, false);
   }

   // Update progress
   const progress = ((noteIndex + 1) / song.notes.length) * 100;
   document.getElementById('progressBar').style.width = progress + '%';

   noteIndex++;
   songTimeout = setTimeout(playNextNote, song.tempo * duration);
}

function changeSong(songKey) {
   stopSong();
   currentSong = songKey;
   document.getElementById('songTitle').textContent = SONGS[songKey].name;
}

// Event listeners
document.querySelectorAll('.chord-btn').forEach(btn => {
   btn.addEventListener('click', () => {
      stopSong();
      showChord(btn.dataset.chord);
   });
});

document.getElementById('soundToggle').addEventListener('click', function () {
   soundEnabled = !soundEnabled;
   this.classList.toggle('active', soundEnabled);
   // Initialize audio context when enabling sound
   if (soundEnabled) {
      getAudioContext();
   }
});

document.getElementById('clearBtn').addEventListener('click', () => {
   stopSong();
   clearNotes();
});

/* --- PARTIE GUITARE & AUDIO (INCHANGÉE) --- */
document.getElementById('soundToggle').addEventListener('click', function () {
   soundEnabled = !soundEnabled;
   this.classList.toggle('active', soundEnabled);
   if (soundEnabled) {
      getAudioContext();
   }
});

document.getElementById('clearBtn').addEventListener('click', () => {
   stopSong();
   clearNotes();
});

document.getElementById('playBtn').addEventListener('click', playSong);

document.getElementById('songSelect').addEventListener('change', function () {
   changeSong(this.value);
});

initFretboard();

document.addEventListener('click', function initAudio() {
   getAudioContext();
   document.removeEventListener('click', initAudio);
}, {
   once: true
});

/* --- PARTIE MENU MOBILE (INCHANGÉE) --- */
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
const navCta = document.querySelector('.nav-cta');

mobileMenuBtn.addEventListener('click', () => {
   const isOpen = navLinks.classList.toggle('active');
   navCta.classList.toggle('active', isOpen);
   mobileMenuBtn.textContent = isOpen ? '✕' : '☰';

   if (isOpen) {
      setTimeout(() => {
         const navLinksHeight = navLinks.offsetHeight;
         navCta.style.top = `calc(100% + ${navLinksHeight}px)`;
      }, 10);
   }
});

navLinks.querySelectorAll('a').forEach(link => {
   link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      navCta.classList.remove('active');
      mobileMenuBtn.textContent = '☰';
   });
});

/* --- PARTIE PRICING (MISE À JOUR) --- */
const PRICING = {
   monthly: { // Correspond à "Essentiel" dans ton HTML
      price: 165,
      period: '',
      billed: 'Paiement unique',
      savings: ''
   },
   quarterly: { // Correspond à "Business" dans ton HTML
      price: 325,
      period: '',
      billed: 'Le plus populaire',
      savings: 'Promotion incluse'
   },
   yearly: { // Correspond à "Premium" dans ton HTML
      price: 520,
      period: '',
      billed: 'Paiement unique',
      savings: 'Meilleure valeur'
   }
};

function updatePricing(billing) {
   // 1. Mise à jour des boutons du haut (le toggle)
   document.querySelectorAll('.billing-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.billing === billing);
   });

   // 2. Correspondance entre le bouton cliqué et l'index de la carte
   // billing "Essentiel" ou "monthly" -> index 0
   // billing "quarterly" -> index 1 (Business)
   // billing "yearly" -> index 2 (Premium)
   let targetIndex = 0;
   if (billing === 'quarterly') targetIndex = 1;
   else if (billing === 'yearly') targetIndex = 2;

   // 3. Appliquer l'effet visuel sur la BONNE carte
   const cards = document.querySelectorAll('.pricing-card');
   cards.forEach((card, index) => {
      if (index === targetIndex) {
         card.classList.add('featured'); // Applique ton style CSS "Most Popular"
         card.style.opacity = "1";
         card.style.transform = "translateY(-10px) scale(1.02)";
      } else {
         card.classList.remove('featured');
         card.style.opacity = "0.4"; // Estompe les autres pour focus
         card.style.transform = "translateY(0) scale(1)";
      }
   });
}

   // 4. Mise à jour du prix affiché
   // Note: Comme tu as des ID 'proPrice' en double, on cible tous les éléments de prix
   const priceDisplays = document.querySelectorAll('.pricing-price span[id="proPrice"], .pricing-price');
   
   // Si tu n'as qu'un seul élément de prix central :
   const mainPrice = document.getElementById('proPrice');
   if (mainPrice) {
      mainPrice.textContent = prices[billing];
   }

document.querySelectorAll('.billing-option').forEach(btn => {
   btn.addEventListener('click', () => updatePricing(btn.dataset.billing));
});

if (document.getElementById('proPrice')) {
    document.getElementById('proPrice').style.transition = 'all 0.15s ease';
}

// --- AJOUT : REDIRECTION VERS SERVICE.HTML / CHECKOUT.HTML ---
document.querySelectorAll('.pricing-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        const card = this.closest('.pricing-card');
        const planName = card.querySelector('.pricing-name').textContent.trim();
        // Redirige vers ta page de paiement avec le nom du plan
        window.location.href = `checkout.html?plan=${encodeURIComponent(planName)}`;
    });
});

/* --- PARTIE PAIEMENT (CONSERVÉE POUR CHECKOUT.HTML) --- */
async function pay() {
    const plan = document.querySelector('input[name="plan"]:checked').value;
    const payment = document.querySelector('input[name="payment"]:checked').value;
    const email = document.getElementById("email").value.trim();
    const btn = document.getElementById("pay-btn");

    if (!email || !email.includes('@')) {
      alert("Veuillez entrer un email valide pour recevoir vos accès.");
      return;
    }

    btn.disabled = true;
    btn.innerText = "PATIENTEZ...";
    btn.style.cursor = "not-allowed";

    try {
      await fetch("https://formspree.io/f/xlgeawpp", {
        method: "POST",
        body: JSON.stringify({
          email: email,
          formule: plan,
          paiement: payment
        }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      console.error("Erreur notification mail:", error);
    }
   document.addEventListener("DOMContentLoaded", function() {
    const sliders = document.querySelectorAll('.slider-track');

    if (sliders.length > 0) {
        setInterval(() => {
            sliders.forEach(slider => {
                // On calcule si on est à la fin
                const isAtEnd = slider.scrollLeft + slider.offsetWidth >= slider.scrollWidth - 5;
                
                if (isAtEnd) {
                    slider.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    slider.scrollBy({ left: slider.offsetWidth, behavior: 'smooth' });
                }
            });
        }, 3000); 
    }
});
    const stripeLinks = {
      "Essentiel": "https://buy.stripe.com/cNi00ledLeY801L6cH9oc00L",
      "Business": "https://buy.stripe.com/4gM4gB2v317i3dXfNh9oc01",
      "Premium": "https://buy.stripe.com/6oU9AV7Png2cg0JeJd9oc02"
    };

    const cryptoLinks = {
      "Essentiel": "https://commerce.coinbase.com/checkout/a01a7da6-bdca-47d9-b0d2-f78f1047ec91",
      "Business": "https://commerce.coinbase.com/checkout/be451f09-7b84-4514-91eb-c245550dd9a4",
      "Premium": "https://commerce.coinbase.com/checkout/9f55932f-8322-49f0-b2e1-83973e1e0783"
    };

    // Note : Correction ici pour correspondre aux labels (Carte Bancaire ou crypto)
    let finalUrl = (payment === "Carte Bancaire" || payment === "card") ? stripeLinks[plan] : cryptoLinks[plan];
    window.location.href = finalUrl + "?prefilled_email=" + encodeURIComponent(email);
}